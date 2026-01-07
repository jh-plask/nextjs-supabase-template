/**
 * Test Nodes
 *
 * DAG nodes for E2E testing. Uses action configs for UI selectors.
 * Organized by domain with explicit dependencies.
 */

import { expect } from "@playwright/test";
import { ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import type { InviteRole } from "./context";
import {
  generateEmail,
  generateOrgName,
  generatePassword,
  generateProjectName,
} from "./context";
import type { TestNode } from "./dag";
import {
  acceptInvitation,
  canSee,
  createOrg,
  createProject,
  invite,
  login,
  logout,
  signup,
} from "./helpers";

// ===========================================
// Invite Roles (from InvitationInput)
// ===========================================

const INVITE_ROLES: InviteRole[] = ["admin", "member", "viewer"];

// ===========================================
// Auth Nodes
// ===========================================

export const authNodes: TestNode[] = [
  {
    id: "auth:signup",
    name: "Owner signs up",
    domain: "auth",
    dependencies: [],
    run: async (ctx) => {
      ctx.owner = {
        email: generateEmail("owner"),
        password: generatePassword(),
      };
      await signup(ctx, ctx.owner.email, ctx.owner.password);
    },
  },
  {
    id: "auth:login",
    name: "Owner logs in again",
    domain: "auth",
    dependencies: ["auth:signup"],
    run: async (ctx) => {
      // After signup (which includes login), logout first to test login independently
      await logout(ctx);
      await login(ctx, ctx.owner.email, ctx.owner.password);
    },
  },
];

// ===========================================
// Org Nodes
// ===========================================

export const orgNodes: TestNode[] = [
  {
    id: "org:create",
    name: "Owner creates organization",
    domain: "org",
    dependencies: ["auth:login"],
    run: async (ctx) => {
      const name = generateOrgName();
      const slug = await createOrg(ctx, name);
      ctx.org = { id: "", name, slug };
    },
  },
];

// ===========================================
// Project Nodes
// ===========================================

export const projectNodes: TestNode[] = [
  {
    id: "projects:create_initial",
    name: "Owner creates initial project",
    domain: "projects",
    dependencies: ["org:create"],
    run: async (ctx) => {
      const name = generateProjectName("Alpha");
      await createProject(ctx, name);
      ctx.projects.set("alpha", { id: "", name, createdBy: "owner" });
    },
  },
  {
    id: "projects:owner_perms",
    name: "Owner has all permissions",
    domain: "projects",
    dependencies: ["projects:create_initial"],
    run: async (ctx) => {
      expect(await canSee(ctx, "newProject")).toBe(true);
      expect(await canSee(ctx, "inviteBtn")).toBe(true);
    },
  },
];

// ===========================================
// Invitation Nodes (generated per role)
// ===========================================

export const invitationNodes: TestNode[] = [
  // Invite each role
  ...INVITE_ROLES.map(
    (role): TestNode => ({
      id: `invitations:invite_${role}`,
      name: `Owner invites ${role}`,
      domain: "invitations",
      dependencies: ["projects:create_initial"],
      run: async (ctx) => {
        const email = generateEmail(role);
        const token = await invite(ctx, email, role);
        ctx.invitations.set(role, { id: "", email, role, token });
      },
    })
  ),
  // Accept invitations (sequential to avoid session conflicts)
  ...INVITE_ROLES.map(
    (role, idx): TestNode => ({
      id: `invitations:accept_${role}`,
      name: `${role} accepts invitation`,
      domain: "invitations",
      dependencies: [
        `invitations:invite_${role}`,
        idx > 0
          ? `invitations:accept_${INVITE_ROLES[idx - 1]}`
          : `invitations:invite_${role}`,
      ],
      run: async (ctx) => {
        await logout(ctx);
        const inv = ctx.invitations.get(role);
        if (!inv) {
          throw new Error(`No invitation for ${role}`);
        }
        const password = generatePassword();
        // Sign up the user first
        await signup(ctx, inv.email, password);
        // Accept the invitation to join the org with correct role
        await acceptInvitation(ctx, inv.email, inv.token);
        ctx.users.set(role, { email: inv.email, password });
      },
    })
  ),
];

// ===========================================
// Role Permission Nodes (generated per role)
// Sequential to avoid session conflicts on single page
// ===========================================

export const permissionNodes: TestNode[] = INVITE_ROLES.map(
  (role, idx): TestNode => ({
    id: `permissions:${role}`,
    name: `${role} has correct permissions`,
    domain: "projects",
    // Sequential: each permission test must wait for previous accept AND previous permission test
    dependencies: [
      `invitations:accept_${INVITE_ROLES.at(-1)}`, // Wait for all accepts to complete
      idx > 0
        ? `permissions:${INVITE_ROLES[idx - 1]}`
        : `invitations:accept_${INVITE_ROLES.at(-1)}`,
    ],
    run: async (ctx) => {
      const userCreds = ctx.users.get(role);
      if (!userCreds) {
        throw new Error(`No credentials for ${role}`);
      }

      console.log(`[${role}] Starting permission check...`);
      await logout(ctx);
      console.log(`[${role}] Logged out, logging in as ${userCreds.email}...`);
      await login(ctx, userCreds.email, userCreds.password);
      console.log(`[${role}] Logged in successfully`);

      // Check permissions per ROLE_PERMISSIONS matrix
      const canCreate =
        ROLE_PERMISSIONS[role]?.includes("projects.create") ?? false;
      const canInvite =
        ROLE_PERMISSIONS[role]?.includes("members.invite") ?? false;

      console.log(`[${role}] Checking canSee(newProject)...`);
      const actualCanCreate = await canSee(ctx, "newProject");
      console.log(`[${role}] Checking canSee(inviteBtn)...`);
      const actualCanInvite = await canSee(ctx, "inviteBtn");

      console.log(
        `[${role}] Expected: canCreate=${canCreate}, canInvite=${canInvite}`
      );
      console.log(
        `[${role}] Actual: canCreate=${actualCanCreate}, canInvite=${actualCanInvite}`
      );

      expect(actualCanCreate).toBe(canCreate);
      expect(actualCanInvite).toBe(canInvite);

      // If can create, test it
      if (canCreate) {
        const name = generateProjectName(role);
        await createProject(ctx, name);
        ctx.projects.set(role, { id: "", name, createdBy: role });
      }
    },
  })
);

// ===========================================
// All Nodes Combined
// ===========================================

export const allNodes: TestNode[] = [
  ...authNodes,
  ...orgNodes,
  ...projectNodes,
  ...invitationNodes,
  ...permissionNodes,
];
