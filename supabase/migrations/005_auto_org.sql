-- ============================================
-- Auto-Create Personal Organization on Signup
-- ============================================
-- Trigger that creates a personal workspace for new users
-- and sets it as their current organization.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  display_name text;
begin
  -- Determine display name for the workspace
  display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- Create personal organization
  insert into public.organizations (name, slug)
  values (
    display_name || '''s Workspace',
    'personal-' || new.id
  )
  returning id into new_org_id;

  -- Add user as owner of their personal org
  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  -- Set as current organization
  insert into public.user_preferences (user_id, current_organization_id)
  values (new.id, new_org_id);

  return new;
end;
$$;

comment on function public.handle_new_user is
  'Creates a personal organization when a new user signs up';


-- ============================================
-- Attach Trigger to auth.users
-- ============================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ============================================
-- Permissions
-- ============================================
-- This function is security definer so it can insert into protected tables
-- during user signup when no RLS context exists yet.

revoke execute on function public.handle_new_user from public;
revoke execute on function public.handle_new_user from anon;
revoke execute on function public.handle_new_user from authenticated;
