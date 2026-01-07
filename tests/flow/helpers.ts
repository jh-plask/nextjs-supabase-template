/**
 * Test Helpers
 *
 * Page helpers that derive selectors from action configs.
 * Uses test ID conventions: {domain}-field-{field}, {domain}-submit-{op}
 */

import { expect } from "@playwright/test";
import {
  type FieldName as AuthFieldName,
  type Operation as AuthOperation,
  authUIConfig,
} from "@/actions/auth/config";
import { type OrgRole, ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import { createAdminClient } from "../utils/supabase-admin";
import type { FlowContext, InviteRole } from "./context";

// ===========================================
// Regex Patterns (hoisted for performance)
// ===========================================

const RE_DASHBOARD = /\/dashboard/;
const RE_DASHBOARD_OR_AUTH = /\/(dashboard|auth)/;
const RE_AUTH = /\/auth/;
const RE_LOG_OUT = /log out/i;
const RE_ORG_NAME = /organization name/i;
const RE_CREATE = /create/i;
const RE_INVITE_MEMBER = /invite member/i;
const RE_EMAIL = /email/i;
const RE_SEND_INVITE = /send invite/i;
const RE_INVITATION_SENT = /invitation sent/i;
const RE_CREATE_PROJECT = /create project/i;
const RE_NAME = /name/i;

// ===========================================
// Auth Helpers (uses auth config)
// ===========================================

/**
 * Fill auth form using field config from schema.
 * Test IDs follow convention: auth-field-{fieldName}
 */
export async function fillAuthForm(
  ctx: FlowContext,
  operation: AuthOperation,
  data: Partial<Record<AuthFieldName, string>>
): Promise<void> {
  const { page, baseUrl } = ctx;
  await page.goto(`${baseUrl}/auth?op=${operation}`);

  const config = authUIConfig[operation];
  for (const field of config.fields) {
    const value = data[field];
    if (value !== undefined) {
      await page.getByTestId(`auth-field-${field}`).fill(value);
    }
  }
}

/**
 * Submit auth form. Test ID: auth-submit-{operation}
 */
export async function submitAuth(
  ctx: FlowContext,
  operation: AuthOperation
): Promise<void> {
  await ctx.page.getByTestId(`auth-submit-${operation}`).click();
}

/**
 * Complete signup flow.
 * Creates pre-confirmed user via admin API, then logs in.
 */
export async function signup(
  ctx: FlowContext,
  email: string,
  password: string
): Promise<void> {
  // Create pre-confirmed user via admin API (bypasses email confirmation)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    // Delete any existing user with this email first
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find((u) => u.email === email);
    if (existingUser) {
      await admin.auth.admin.deleteUser(existingUser.id);
    }
    // Create pre-confirmed user via admin API
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    // Login instead of signup (user already exists and is confirmed)
    await login(ctx, email, password);
  } else {
    // Fallback to UI signup (will require email confirmation)
    await fillAuthForm(ctx, "signup", {
      email,
      password,
      confirmPassword: password,
    });
    await submitAuth(ctx, "signup");
    await expect(ctx.page).toHaveURL(RE_DASHBOARD_OR_AUTH, { timeout: 15_000 });
  }
}

/**
 * Complete login flow.
 */
export async function login(
  ctx: FlowContext,
  email: string,
  password: string
): Promise<void> {
  // Add delay before login to avoid Supabase auth rate limits
  await ctx.page.waitForTimeout(3000);

  console.log(`[login] Attempting login for: ${email}`);
  await fillAuthForm(ctx, "login", { email, password });
  console.log("[login] Form filled, submitting...");
  await submitAuth(ctx, "login");
  console.log("[login] Submitted, waiting for navigation...");

  // Wait for navigation to complete (with shorter timeout)
  await expect(ctx.page).toHaveURL(RE_DASHBOARD, { timeout: 15_000 });
  console.log(`[login] Navigation complete, URL: ${ctx.page.url()}`);

  // Wait for session cookies to be fully established
  await ctx.page.waitForTimeout(2000);

  // Reload and verify we stay on dashboard (session is valid)
  await ctx.page.reload();
  await ctx.page.waitForLoadState("load");
  await expect(ctx.page).toHaveURL(RE_DASHBOARD, { timeout: 10_000 });

  // Extra wait for session to fully sync before next navigation
  await ctx.page.waitForTimeout(2000);
  console.log("[login] Session verified after reload");
}

/**
 * Logout via user menu.
 */
export async function logout(ctx: FlowContext): Promise<void> {
  console.log("[logout] Starting logout...");

  // Navigate to dashboard first to ensure we're on the right page
  await ctx.page.goto(`${ctx.baseUrl}/dashboard`);
  await ctx.page.waitForLoadState("load");

  // Dismiss Next.js dev overlay if present (it can intercept clicks)
  await ctx.page.evaluate(() => {
    const overlay = document.querySelector("nextjs-portal");
    if (overlay) {
      overlay.remove();
    }
  });

  // Click trigger and wait for dropdown - use force to bypass any remaining overlays
  const trigger = ctx.page.getByTestId("user-menu-trigger");
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await trigger.click({ force: true });

  // Wait for dropdown content to appear and click logout button
  // The logout is a button containing a DropdownMenuItem with "Log out" text
  const logoutBtn = ctx.page.getByRole("button", { name: RE_LOG_OUT });
  await expect(logoutBtn).toBeVisible({ timeout: 5000 });
  await logoutBtn.click({ force: true });
  await expect(ctx.page).toHaveURL(RE_AUTH, { timeout: 10_000 });

  // Wait for session to be fully cleared
  await ctx.page.waitForTimeout(1000);
  console.log("[logout] Logout complete");
}

// ===========================================
// Org Helpers
// ===========================================

/**
 * Create organization. Test IDs: org-field-name, org-submit-create
 */
export async function createOrg(
  ctx: FlowContext,
  name: string
): Promise<string> {
  const { page, baseUrl } = ctx;
  await page.goto(`${baseUrl}/dashboard/org/new`);
  await page.getByLabel(RE_ORG_NAME).fill(name);
  await page.getByRole("button", { name: RE_CREATE }).click();

  // Wait for navigation to dashboard after successful creation
  await expect(page).toHaveURL(RE_DASHBOARD, { timeout: 10_000 });

  // The app calls refreshClaims() after org creation
  // Wait for it to complete and for cookies to be updated
  await page.waitForTimeout(3000);

  // Get the owner user ID first
  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.listUsers();
  const ownerUser = userData?.users.find(
    (u) => u.email?.toLowerCase() === ctx.owner.email.toLowerCase()
  );

  if (!ownerUser) {
    throw new Error(`Owner user not found: ${ctx.owner.email}`);
  }

  // Find the org the owner just created (they'll be the owner member)
  const { data: membership, error: memberError } = await admin
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", ownerUser.id)
    .eq("role", "owner")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (memberError || !membership) {
    throw new Error(`Failed to find owner membership: ${memberError?.message}`);
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("id", membership.organization_id)
    .single();

  if (orgError || !org) {
    throw new Error(`Failed to find org: ${orgError?.message}`);
  }

  // Set org data in context
  ctx.org = { id: org.id, name: org.name, slug: org.slug };
  console.log(`[createOrg] Org created: ${org.id}, slug: ${org.slug}`);

  // Explicitly set user_preferences so JWT claims will have org_id
  await admin.from("user_preferences").upsert({
    user_id: ownerUser.id,
    current_organization_id: org.id,
  });
  console.log("[createOrg] Set user_preferences.current_organization_id");

  // Log out and log back in to force a completely fresh session with updated JWT claims
  // This ensures the custom_access_token_hook runs with the new org membership
  await logout(ctx);
  await login(ctx, ctx.owner.email, ctx.owner.password);

  return org.slug;
}

// ===========================================
// Invitation Helpers
// ===========================================

/**
 * Invite member. Test ID convention for invite form.
 * Returns the invitation token for acceptance.
 */
export async function invite(
  ctx: FlowContext,
  email: string,
  role: InviteRole
): Promise<string> {
  const { page, baseUrl } = ctx;
  await page.goto(`${baseUrl}/dashboard/org/members`);
  await page.getByRole("button", { name: RE_INVITE_MEMBER }).click();
  await page.waitForTimeout(300); // Dialog animation

  // Fill email
  await page.getByLabel(RE_EMAIL).fill(email);

  // Select role using custom Select component (not native <select>)
  await page.getByTestId("invite-field-role").click();
  await page.getByRole("option", { name: new RegExp(role, "i") }).click();

  // Submit
  await page.getByRole("button", { name: RE_SEND_INVITE }).click();
  await expect(
    page.getByText(email).or(page.getByText(RE_INVITATION_SENT))
  ).toBeVisible({ timeout: 5000 });

  // Fetch the token from DB (invite creates it server-side)
  const admin = createAdminClient();
  const { data: invitation, error } = await admin
    .from("organization_invitations")
    .select("token")
    .eq("email", email.toLowerCase())
    .eq("status", "pending")
    .single();

  if (error || !invitation?.token) {
    throw new Error(
      `Failed to get invitation token for ${email}: ${error?.message}`
    );
  }

  return invitation.token;
}

/**
 * Accept invitation via admin client.
 * Uses service role to directly create membership, mimicking RPC behavior.
 * Must be called after user has signed up with the invited email.
 */
export async function acceptInvitation(
  ctx: FlowContext,
  email: string,
  token: string
): Promise<void> {
  const admin = createAdminClient();

  // Get the invitation
  const { data: invitation, error: invError } = await admin
    .from("organization_invitations")
    .select("id, organization_id, role, email")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (invError || !invitation) {
    throw new Error(`Invitation not found: ${invError?.message}`);
  }

  console.log(
    `[acceptInvitation] Invitation found - email: ${invitation.email}, role: ${invitation.role}`
  );

  // Get the user by email
  const { data: userData } = await admin.auth.admin.listUsers();
  const user = userData?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    throw new Error(`User not found for email: ${email}`);
  }

  // Create membership
  console.log(
    `[acceptInvitation] Creating membership with role: ${invitation.role}`
  );
  const { data: membership, error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
    })
    .select("id, role")
    .single();

  if (memberError) {
    throw new Error(`Failed to create membership: ${memberError.message}`);
  }
  console.log(
    `[acceptInvitation] Membership created with role: ${membership?.role}`
  );

  // Update invitation status
  await admin
    .from("organization_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  // Set user's current org preference so JWT claims include it
  await admin.from("user_preferences").upsert({
    user_id: user.id,
    current_organization_id: invitation.organization_id,
  });

  // Navigate to a page that will trigger session refresh
  // The dashboard layout fetches user data which refreshes the session
  await ctx.page.goto(`${ctx.baseUrl}/dashboard`);
  await ctx.page.waitForLoadState("load");

  // Force a hard refresh to ensure cookies are updated
  await ctx.page.reload();
  await ctx.page.waitForLoadState("load");
}

// ===========================================
// Project Helpers
// ===========================================

/**
 * Create project.
 */
export async function createProject(
  ctx: FlowContext,
  name: string
): Promise<void> {
  const { page, baseUrl } = ctx;
  await page.goto(`${baseUrl}/dashboard/projects`);
  await page.waitForLoadState("load");

  // Wait for the Create project button to appear (indicates RBAC context is loaded)
  const createBtn = page.getByRole("button", { name: RE_CREATE_PROJECT });
  await expect(createBtn).toBeVisible({ timeout: 15_000 });

  // Click "Create project" button and wait for dialog
  await createBtn.click();
  await page.waitForTimeout(500); // Wait for dialog animation

  // Fill and submit form
  await page.getByLabel(RE_NAME).fill(name);
  await page.getByRole("button", { name: RE_CREATE }).click();

  // Wait for dialog to close and router.refresh() to complete
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
}

/**
 * Check if UI element is visible based on permission.
 */
export async function canSee(
  ctx: FlowContext,
  selector: "newProject" | "editBtn" | "inviteBtn"
): Promise<boolean> {
  const { page, baseUrl } = ctx;

  if (selector === "newProject") {
    await page.goto(`${baseUrl}/dashboard/projects`);
    await page.waitForLoadState("load");
    return page
      .getByRole("button", { name: RE_CREATE_PROJECT })
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  if (selector === "editBtn") {
    await page.goto(`${baseUrl}/dashboard/projects`);
    await page.waitForLoadState("load");
    const list = page.getByTestId("projects-list");
    const visible = await list.isVisible().catch(() => false);
    if (!visible) {
      return false;
    }
    await list.locator("> div").first().hover();
    return page
      .getByTestId("project-edit-btn")
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  if (selector === "inviteBtn") {
    await page.goto(`${baseUrl}/dashboard/org/members`);
    await page.waitForLoadState("load");
    return page
      .getByRole("button", { name: RE_INVITE_MEMBER })
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  return false;
}

// ===========================================
// Permission Helpers
// ===========================================

export function hasPermission(
  role: OrgRole,
  permission: keyof typeof ROLE_PERMISSIONS.owner extends infer P ? P : never
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission as never) ?? false;
}
