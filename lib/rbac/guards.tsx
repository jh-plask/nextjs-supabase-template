"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgContext, usePermission } from "./hooks";
import type { OrgRole, Permission } from "./permissions";

// ============================================
// RequirePermission Component
// ============================================

interface RequirePermissionProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequirePermission({
  permission,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const allowed = usePermission(permission);

  if (!allowed) {
    return fallback;
  }

  return children;
}

// ============================================
// RequireRole Component
// ============================================

interface RequireRoleProps {
  roles: OrgRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireRole({
  roles,
  fallback = null,
  children,
}: RequireRoleProps) {
  const { orgRole } = useOrgContext();

  if (!(orgRole && roles.includes(orgRole))) {
    return fallback;
  }

  return children;
}

// ============================================
// RequireOrg Component
// ============================================

interface RequireOrgProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireOrg({ fallback = null, children }: RequireOrgProps) {
  const { orgId, isLoading } = useOrgContext();

  if (isLoading) {
    return null;
  }

  if (!orgId) {
    return fallback;
  }

  return children;
}

// ============================================
// OrgGate Component (Shows loading state)
// ============================================

interface OrgGateProps {
  loading?: ReactNode;
  noOrg?: ReactNode;
  children: ReactNode;
}

const defaultLoading = (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-32 w-full rounded-lg" />
  </div>
);

export function OrgGate({
  loading = defaultLoading,
  noOrg = <div>Please select an organization</div>,
  children,
}: OrgGateProps) {
  const { orgId, isLoading } = useOrgContext();

  if (isLoading) {
    return loading;
  }

  if (!orgId) {
    return noOrg;
  }

  return children;
}
