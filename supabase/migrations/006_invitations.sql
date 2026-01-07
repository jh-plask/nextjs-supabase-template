-- ============================================
-- Organization Invitations
-- ============================================
-- Support for email-based invitations to organizations.

-- 1. INVITATION STATUS TYPE
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');


-- 2. INVITATIONS TABLE
create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.org_role not null default 'member',
  invited_by uuid references auth.users(id) on delete set null,
  status public.invitation_status not null default 'pending',
  token uuid unique not null default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,

  -- One pending invitation per email per org
  unique(organization_id, email)
);

comment on table public.organization_invitations is
  'Pending and historical organization invitations';


-- 3. INDEXES
create index idx_invitations_token on public.organization_invitations(token);
create index idx_invitations_email on public.organization_invitations(email);
create index idx_invitations_org on public.organization_invitations(organization_id);
create index idx_invitations_status on public.organization_invitations(status);


-- 4. ENABLE RLS
alter table public.organization_invitations enable row level security;


-- 5. RLS POLICIES

-- SELECT: View invitations for orgs you can manage, or your own (by email)
create policy "View invitations for your orgs or by your email"
  on public.organization_invitations
  for select
  to authenticated
  using (
    -- Can view if you have invite permission for this org
    (
      organization_id = (select public.current_org_id())
      and (select private.authorize('members.invite'))
    )
    -- Or if the invitation is for your email
    or (
      email = (select auth.jwt() ->> 'email')
      and status = 'pending'
    )
  );

-- INSERT: Create invitations with permission
create policy "Create invitations with permission"
  on public.organization_invitations
  for insert
  to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select private.authorize('members.invite'))
    and status = 'pending'
  );

-- UPDATE: Accept invitations addressed to your email
create policy "Accept invitations addressed to you"
  on public.organization_invitations
  for update
  to authenticated
  using (
    email = (select auth.jwt() ->> 'email')
    and status = 'pending'
  )
  with check (
    email = (select auth.jwt() ->> 'email')
    and status in ('accepted', 'pending')
  );

-- UPDATE: Revoke invitations with permission
create policy "Revoke invitations with permission"
  on public.organization_invitations
  for update
  to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select private.authorize('members.invite'))
    and status = 'pending'
  )
  with check (
    status in ('revoked', 'pending')
  );

-- DELETE: Delete invitations with permission
create policy "Delete invitations with permission"
  on public.organization_invitations
  for delete
  to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select private.authorize('members.invite'))
  );


-- 6. ACCEPT INVITATION FUNCTION
-- Atomic function to accept an invitation and create membership
create or replace function public.accept_invitation(invitation_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  user_email text;
  user_uuid uuid;
begin
  -- Get current user info
  user_uuid := auth.uid();
  user_email := auth.jwt() ->> 'email';

  if user_uuid is null then
    raise exception 'Not authenticated';
  end if;

  -- Find and lock the invitation
  select * into inv
  from public.organization_invitations
  where token = invitation_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if inv is null then
    raise exception 'Invalid or expired invitation';
  end if;

  -- Verify email matches
  if lower(inv.email) != lower(user_email) then
    raise exception 'Invitation was sent to a different email address';
  end if;

  -- Check if already a member
  if exists (
    select 1 from public.organization_members
    where organization_id = inv.organization_id
      and user_id = user_uuid
  ) then
    -- Mark invitation as accepted but don't create duplicate membership
    update public.organization_invitations
    set status = 'accepted', accepted_at = now()
    where id = inv.id;

    return jsonb_build_object(
      'success', true,
      'organization_id', inv.organization_id,
      'message', 'Already a member of this organization'
    );
  end if;

  -- Create membership
  insert into public.organization_members (organization_id, user_id, role)
  values (inv.organization_id, user_uuid, inv.role);

  -- Mark invitation as accepted
  update public.organization_invitations
  set status = 'accepted', accepted_at = now()
  where id = inv.id;

  return jsonb_build_object(
    'success', true,
    'organization_id', inv.organization_id,
    'role', inv.role
  );
end;
$$;

comment on function public.accept_invitation is
  'Accept an organization invitation and create membership';

grant execute on function public.accept_invitation to authenticated;


-- 7. CLEANUP EXPIRED INVITATIONS (Optional scheduled job)
create or replace function public.cleanup_expired_invitations()
returns integer
language plpgsql
security definer
as $$
declare
  updated_count integer;
begin
  update public.organization_invitations
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

comment on function public.cleanup_expired_invitations is
  'Mark expired invitations as expired (run via pg_cron)';
