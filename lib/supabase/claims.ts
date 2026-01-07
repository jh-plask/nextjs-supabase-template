import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * JWT Claims Utilities for Multi-Tenant RBAC
 *
 * In a multi-tenant system with custom JWT claims (org_id, org_role),
 * there can be timing issues where the JWT doesn't reflect the latest
 * database state (e.g., after org creation or org switching).
 *
 * This module provides defensive utilities to ensure fresh claims.
 */

export interface OrgClaims {
  org_id: string | null;
  org_role: string | null;
  orgs: string[];
}

/**
 * Parse organization claims from JWT access token
 */
export function parseOrgClaims(accessToken: string | undefined): OrgClaims {
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

/**
 * Get organization claims with defensive refresh
 *
 * This handles the case where middleware cookie propagation doesn't
 * reach server actions in Next.js. If org_id is missing from the
 * current session, it refreshes to get updated JWT claims from the
 * custom_access_token_hook.
 *
 * @param supabase - Supabase client instance
 * @returns Organization claims (org_id, org_role, orgs)
 */
export async function getOrgClaimsWithRefresh(
  supabase: SupabaseClient
): Promise<OrgClaims> {
  // Try current session first
  const { data: sessionData } = await supabase.auth.getSession();
  let claims = parseOrgClaims(sessionData.session?.access_token);

  // If org_id is missing but user has orgs, refresh to get updated claims
  if (!claims.org_id) {
    const { data: refreshedData } = await supabase.auth.refreshSession();
    claims = parseOrgClaims(refreshedData.session?.access_token);
  }

  return claims;
}

/**
 * Require organization context
 *
 * Gets org claims with defensive refresh and throws if no org is selected.
 * Use this in server actions that require organization context.
 *
 * @param supabase - Supabase client instance
 * @returns Organization claims (guaranteed non-null org_id)
 * @throws Error if no organization is selected
 */
export async function requireOrgContext(
  supabase: SupabaseClient
): Promise<OrgClaims & { org_id: string }> {
  const claims = await getOrgClaimsWithRefresh(supabase);

  if (!claims.org_id) {
    throw new Error(
      "No organization selected. Please select or create an organization first."
    );
  }

  return claims as OrgClaims & { org_id: string };
}
