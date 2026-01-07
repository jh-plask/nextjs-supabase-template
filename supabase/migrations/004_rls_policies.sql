-- ============================================
-- Row Level Security Policies
-- ============================================
-- All policies use JWT claims for maximum performance.
-- Pattern: (select auth.jwt() ->> 'field') wraps claim access for caching.


-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_preferences enable row level security;
alter table public.projects enable row level security;


-- ============================================
-- 2. ORGANIZATIONS POLICIES
-- ============================================

-- SELECT: Members can view their organizations
create policy "Members can view their organizations"
  on public.organizations
  for select
  to authenticated
  using (
    id = any((select public.get_my_orgs()))
  );

-- INSERT: Any authenticated user can create an organization
create policy "Authenticated users can create organizations"
  on public.organizations
  for insert
  to authenticated
  with check (true);

-- UPDATE: Only admins/owners of current org can update
create policy "Admins can update their organization"
  on public.organizations
  for update
  to authenticated
  using (
    id = (select public.current_org_id())
    and (select private.authorize('org.update'))
  );

-- DELETE: Only owners can delete their organization
create policy "Owners can delete their organization"
  on public.organizations
  for delete
  to authenticated
  using (
    id = (select public.current_org_id())
    and (select private.authorize('org.delete'))
  );


-- ============================================
-- 3. ORGANIZATION_MEMBERS POLICIES
-- ============================================

-- SELECT: View members of organizations you belong to
create policy "View members of your organizations"
  on public.organization_members
  for select
  to authenticated
  using (
    organization_id = any((select public.get_my_orgs()))
  );

-- INSERT: Invite members with permission (or self-join via invite)
create policy "Invite members with permission"
  on public.organization_members
  for insert
  to authenticated
  with check (
    -- Either: has invite permission for current org
    (
      organization_id = (select public.current_org_id())
      and (select private.authorize('members.invite'))
    )
    -- Or: is adding self as owner to a new org (org creation flow)
    or (
      user_id = (select auth.uid())
      and role = 'owner'
      and not exists (
        select 1 from public.organization_members
        where organization_id = organization_members.organization_id
      )
    )
  );

-- UPDATE: Update roles with permission (cannot self-demote owner)
create policy "Update member roles with permission"
  on public.organization_members
  for update
  to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select private.authorize('members.update_role'))
  )
  with check (
    organization_id = (select public.current_org_id())
    and (select private.authorize('members.update_role'))
    -- Prevent demoting the last owner
    and (
      role = 'owner'
      or exists (
        select 1 from public.organization_members om
        where om.organization_id = organization_members.organization_id
          and om.role = 'owner'
          and om.id != organization_members.id
      )
    )
  );

-- DELETE: Remove members with permission (cannot remove last owner)
create policy "Remove members with permission"
  on public.organization_members
  for delete
  to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select private.authorize('members.remove'))
    -- Prevent removing the last owner
    and (
      role != 'owner'
      or exists (
        select 1 from public.organization_members om
        where om.organization_id = organization_members.organization_id
          and om.role = 'owner'
          and om.id != organization_members.id
      )
    )
  );

-- Self-removal: Users can leave organizations (except last owner)
create policy "Users can leave organizations"
  on public.organization_members
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    -- Prevent last owner from leaving
    and (
      role != 'owner'
      or exists (
        select 1 from public.organization_members om
        where om.organization_id = organization_members.organization_id
          and om.role = 'owner'
          and om.user_id != (select auth.uid())
      )
    )
  );


-- ============================================
-- 4. ROLE_PERMISSIONS POLICIES
-- ============================================
-- This is a read-only reference table.

-- SELECT: Anyone authenticated can read role permissions
create policy "Anyone can read role permissions"
  on public.role_permissions
  for select
  to authenticated
  using (true);


-- ============================================
-- 5. USER_PREFERENCES POLICIES
-- ============================================

-- ALL: Users can only manage their own preferences
create policy "Users manage their own preferences"
  on public.user_preferences
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));


-- ============================================
-- 6. PROJECTS POLICIES (Tenant-Scoped Resource)
-- ============================================

-- SELECT: Read projects in current org with permission
create policy "Read projects in current org"
  on public.projects
  for select
  to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select private.authorize('projects.read'))
  );

-- INSERT: Create projects in current org with permission
create policy "Create projects in current org"
  on public.projects
  for insert
  to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select private.authorize('projects.create'))
  );

-- UPDATE: Update projects in current org with permission
create policy "Update projects in current org"
  on public.projects
  for update
  to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select private.authorize('projects.update'))
  );

-- DELETE: Delete projects in current org with permission
create policy "Delete projects in current org"
  on public.projects
  for delete
  to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select private.authorize('projects.delete'))
  );
