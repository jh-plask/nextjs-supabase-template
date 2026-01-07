"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasPermission, type OrgRole, type Permission } from "./permissions";

// ============================================
// JWT Claims Interface
// ============================================

interface OrgClaims {
  org_id: string | null;
  org_role: OrgRole | null;
  orgs: string[];
}

// ============================================
// Parse JWT Claims
// ============================================

function parseJwtClaims(accessToken: string | null): OrgClaims {
  if (!accessToken) {
    return { org_id: null, org_role: null, orgs: [] };
  }

  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    return {
      org_id: payload.org_id ?? null,
      org_role: payload.org_role ?? null,
      orgs: payload.orgs ?? [],
    };
  } catch {
    return { org_id: null, org_role: null, orgs: [] };
  }
}

// ============================================
// useOrgContext Hook
// ============================================

export function useOrgContext() {
  const [claims, setClaims] = useState<OrgClaims>({
    org_id: null,
    org_role: null,
    orgs: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setClaims(parseJwtClaims(session.access_token));
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setClaims(parseJwtClaims(session.access_token));
      } else {
        setClaims({ org_id: null, org_role: null, orgs: [] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshClaims = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.refreshSession();
    if (data.session?.access_token) {
      setClaims(parseJwtClaims(data.session.access_token));
    }
  }, []);

  return {
    orgId: claims.org_id,
    orgRole: claims.org_role,
    orgIds: claims.orgs,
    isLoading,
    refreshClaims,
  };
}

// ============================================
// usePermission Hook
// ============================================

export function usePermission(permission: Permission): boolean {
  const { orgRole } = useOrgContext();
  return hasPermission(orgRole, permission);
}

// ============================================
// usePermissions Hook (Multiple)
// ============================================

export function usePermissions(
  permissions: Permission[]
): Record<Permission, boolean> {
  const { orgRole } = useOrgContext();

  return permissions.reduce(
    (acc, permission) => {
      acc[permission] = hasPermission(orgRole, permission);
      return acc;
    },
    {} as Record<Permission, boolean>
  );
}
