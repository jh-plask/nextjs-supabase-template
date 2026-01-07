// ============================================
// Permission Types and Constants
// ============================================

export const ORG_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const PERMISSIONS = [
  // Organization
  "org.update",
  "org.delete",
  "org.billing",
  // Members
  "members.invite",
  "members.remove",
  "members.update_role",
  // Projects
  "projects.create",
  "projects.read",
  "projects.update",
  "projects.delete",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ============================================
// Role-Permission Matrix (Client-Side Mirror)
// ============================================
// This should match the database role_permissions table

export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    "org.update",
    "org.delete",
    "org.billing",
    "members.invite",
    "members.remove",
    "members.update_role",
    "projects.create",
    "projects.read",
    "projects.update",
    "projects.delete",
  ],
  admin: [
    "org.update",
    "members.invite",
    "members.remove",
    "members.update_role",
    "projects.create",
    "projects.read",
    "projects.update",
    "projects.delete",
  ],
  member: [
    "projects.create",
    "projects.read",
    "projects.update",
    "projects.delete",
  ],
  viewer: ["projects.read"],
};

// ============================================
// Permission Helpers
// ============================================

export function hasPermission(
  role: OrgRole | null,
  permission: Permission
): boolean {
  if (!role) {
    return false;
  }
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageOrg(role: OrgRole | null): boolean {
  return hasPermission(role, "org.update");
}

export function canManageMembers(role: OrgRole | null): boolean {
  return hasPermission(role, "members.invite");
}

export function canManageProjects(role: OrgRole | null): boolean {
  return hasPermission(role, "projects.create");
}

export function isOwner(role: OrgRole | null): boolean {
  return role === "owner";
}

export function isAdmin(role: OrgRole | null): boolean {
  return role === "owner" || role === "admin";
}
