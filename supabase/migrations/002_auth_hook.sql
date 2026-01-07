-- ============================================
-- Custom Access Token Hook
-- ============================================
-- This function runs before JWT issuance and injects
-- org_id, org_role, and orgs[] claims into the token.
-- These claims are then used by RLS policies.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  user_uuid uuid;
  org_id uuid;
  org_role public.org_role;
  org_ids uuid[];
begin
  -- Extract user ID from event
  user_uuid := (event->>'user_id')::uuid;

  -- Get user's current organization preference
  select current_organization_id into org_id
  from public.user_preferences
  where user_id = user_uuid;

  -- Get role in current org (only if org is set)
  if org_id is not null then
    select role into org_role
    from public.organization_members
    where user_id = user_uuid
      and organization_id = org_id;

    -- If user is no longer a member of their "current" org, clear it
    if org_role is null then
      org_id := null;
    end if;
  end if;

  -- Get all org memberships for this user
  select array_agg(organization_id) into org_ids
  from public.organization_members
  where user_id = user_uuid;

  -- Build claims object
  claims := coalesce(event->'claims', '{}'::jsonb);

  -- Inject organization claims
  claims := jsonb_set(claims, '{org_id}', coalesce(to_jsonb(org_id), 'null'::jsonb));
  claims := jsonb_set(claims, '{org_role}', coalesce(to_jsonb(org_role), 'null'::jsonb));
  claims := jsonb_set(claims, '{orgs}', coalesce(to_jsonb(org_ids), '[]'::jsonb));

  -- Return modified event
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

comment on function public.custom_access_token_hook is
  'Injects org_id, org_role, and orgs[] claims into JWT for RLS';


-- ============================================
-- Permissions for Auth Hook
-- ============================================
-- The supabase_auth_admin role needs to execute this function
-- and read the relevant tables.

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant select on public.user_preferences to supabase_auth_admin;
grant select on public.organization_members to supabase_auth_admin;

-- Revoke from public for security
revoke execute on function public.custom_access_token_hook from public;
revoke execute on function public.custom_access_token_hook from anon;
revoke execute on function public.custom_access_token_hook from authenticated;
