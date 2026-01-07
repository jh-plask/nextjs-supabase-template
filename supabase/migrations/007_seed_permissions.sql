-- ============================================
-- Seed Role Permissions
-- ============================================
-- Default permission matrix for all roles.
-- This is the single source of truth for what each role can do.

insert into public.role_permissions (role, permission) values
  -- ==========================================
  -- OWNER: Full access to everything
  -- ==========================================
  ('owner', 'org.update'),
  ('owner', 'org.delete'),
  ('owner', 'org.billing'),
  ('owner', 'members.invite'),
  ('owner', 'members.remove'),
  ('owner', 'members.update_role'),
  ('owner', 'projects.create'),
  ('owner', 'projects.read'),
  ('owner', 'projects.update'),
  ('owner', 'projects.delete'),

  -- ==========================================
  -- ADMIN: All except org.delete and org.billing
  -- ==========================================
  ('admin', 'org.update'),
  ('admin', 'members.invite'),
  ('admin', 'members.remove'),
  ('admin', 'members.update_role'),
  ('admin', 'projects.create'),
  ('admin', 'projects.read'),
  ('admin', 'projects.update'),
  ('admin', 'projects.delete'),

  -- ==========================================
  -- MEMBER: Full project access, no org management
  -- ==========================================
  ('member', 'projects.create'),
  ('member', 'projects.read'),
  ('member', 'projects.update'),
  ('member', 'projects.delete'),

  -- ==========================================
  -- VIEWER: Read-only access to projects
  -- ==========================================
  ('viewer', 'projects.read')

on conflict (role, permission) do nothing;
