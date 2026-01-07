-- ============================================
-- Authorization Helper Functions
-- ============================================
-- Security definer functions for permission checks.
-- These bypass RLS to check permissions efficiently.

-- Create private schema for internal functions
create schema if not exists private;


-- ============================================
-- 1. AUTHORIZE FUNCTION (Permission Check)
-- ============================================
-- Used in RLS policies: (select private.authorize('projects.create'))
-- Security definer bypasses RLS for the permission lookup itself.

create or replace function private.authorize(requested_permission public.org_permission)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  user_role public.org_role;
  has_permission boolean;
begin
  -- Get role from JWT claims (wrapped in select for performance)
  user_role := (select auth.jwt() ->> 'org_role')::public.org_role;

  -- No role = no permission
  if user_role is null then
    return false;
  end if;

  -- Check if this role has the requested permission
  select exists(
    select 1
    from public.role_permissions
    where role = user_role
      and permission = requested_permission
  ) into has_permission;

  return has_permission;
end;
$$;

comment on function private.authorize is
  'Checks if current user''s org_role has the requested permission';


-- ============================================
-- 2. CURRENT_ORG_ID HELPER
-- ============================================
-- Returns the current organization ID from JWT claims.
-- Usage: (select public.current_org_id())

create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() ->> 'org_id')::uuid;
$$;

comment on function public.current_org_id is
  'Returns the current organization ID from JWT claims';


-- ============================================
-- 3. IS_ORG_MEMBER HELPER
-- ============================================
-- Checks if the current user is a member of a specific organization.
-- Usage: (select public.is_org_member(some_org_id))

create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language plpgsql
stable
as $$
begin
  return exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'orgs', '[]'::jsonb)) as org_id
    where org_id::uuid = check_org_id
  );
end;
$$;

comment on function public.is_org_member is
  'Checks if current user is a member of the specified organization';


-- ============================================
-- 4. GET_MY_ORGS HELPER
-- ============================================
-- Returns array of organization IDs the user belongs to.
-- Usage: (select public.get_my_orgs())

create or replace function public.get_my_orgs()
returns uuid[]
language plpgsql
stable
as $$
declare
  orgs_jsonb jsonb;
  result uuid[];
begin
  orgs_jsonb := coalesce(auth.jwt() -> 'orgs', '[]'::jsonb);

  select array_agg(elem::uuid)
  into result
  from jsonb_array_elements_text(orgs_jsonb) as elem;

  return coalesce(result, array[]::uuid[]);
end;
$$;

comment on function public.get_my_orgs is
  'Returns array of organization IDs the current user belongs to';


-- ============================================
-- 5. GET_MY_ORG_ROLE HELPER
-- ============================================
-- Returns the user's role in the current organization.
-- Usage: (select public.get_my_org_role())

create or replace function public.get_my_org_role()
returns public.org_role
language sql
stable
as $$
  select (auth.jwt() ->> 'org_role')::public.org_role;
$$;

comment on function public.get_my_org_role is
  'Returns the user''s role in the current organization';


-- ============================================
-- Permissions
-- ============================================

-- Private schema functions only callable by postgres (RLS uses them internally)
grant usage on schema private to postgres;
grant execute on function private.authorize to postgres;

-- Public helpers available to authenticated users
grant execute on function public.current_org_id to authenticated;
grant execute on function public.is_org_member to authenticated;
grant execute on function public.get_my_orgs to authenticated;
grant execute on function public.get_my_org_role to authenticated;
