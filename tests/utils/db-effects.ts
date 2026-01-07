import { expect } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbEffect } from "../plans/auth";

/**
 * Verify database effects after an action.
 * Uses service role client to bypass RLS.
 */
export async function expectDbEffects(
  admin: SupabaseClient,
  effects: DbEffect[]
) {
  for (const effect of effects) {
    const expected = effect.expectCount ?? (effect.op === "delete" ? 0 : 1);

    let query = admin.from(effect.table).select("*", { count: "exact" });

    if (effect.match) {
      query = query.match(effect.match);
    }

    const { count, error } = await query;

    expect(error, `DB error on ${effect.table}`).toBeNull();
    expect(
      count,
      `DB effect mismatch: expected ${expected} rows for ${effect.op} on ${effect.table}`
    ).toBe(expected);
  }
}

/**
 * Clean up test organizations created during tests.
 * Deletes orgs matching the test pattern.
 */
export async function cleanupTestOrgs(admin: SupabaseClient) {
  // Delete orgs with test-related names
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name")
    .or("name.ilike.%Test%,name.ilike.%E2E%,slug.ilike.%test%");

  if (orgs && orgs.length > 0) {
    for (const org of orgs) {
      // Delete members first (cascade should handle this, but explicit is safer)
      await admin
        .from("organization_members")
        .delete()
        .eq("organization_id", org.id);

      // Delete the org
      await admin.from("organizations").delete().eq("id", org.id);

      console.log(`Cleaned up test org: ${org.name}`);
    }
  }

  console.log(`Cleaned up ${orgs?.length ?? 0} test organization(s)`);
}

/**
 * Create a test organization for a user.
 * Returns the org ID.
 */
export async function createTestOrg(
  admin: SupabaseClient,
  userId: string,
  name = "E2E Test Org"
): Promise<string> {
  // Create org
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name, slug: `e2e-test-${Date.now()}` })
    .select("id")
    .single();

  if (orgError) {
    throw new Error(`Failed to create test org: ${orgError.message}`);
  }

  // Add user as owner
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: "owner",
    });

  if (memberError) {
    throw new Error(`Failed to add user to org: ${memberError.message}`);
  }

  // Set as current org in preferences
  await admin.from("user_preferences").upsert({
    user_id: userId,
    current_organization_id: org.id,
  });

  console.log(`Created test org: ${name} (${org.id})`);
  return org.id;
}

/**
 * Get user's current organization ID from preferences.
 */
export async function getCurrentOrgId(
  admin: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await admin
    .from("user_preferences")
    .select("current_organization_id")
    .eq("user_id", userId)
    .single();

  return data?.current_organization_id ?? null;
}
