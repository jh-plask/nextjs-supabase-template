/**
 * Test Flow Context
 *
 * Single source of types - all derived from action schemas.
 */

import type { Page } from "@playwright/test";
import type { InvitationInput } from "@/actions/invitations/schema";
import type { OrgInput } from "@/actions/org/schema";
import type { ProjectInput } from "@/actions/projects/schema";
import type { AuthInput } from "@/domains/auth/schema";

// ===========================================
// Runtime Types (derived from action schemas)
// ===========================================

/** User credentials - required fields from AuthInput */
export interface UserCredentials {
  email: NonNullable<AuthInput["email"]>;
  password: NonNullable<AuthInput["password"]>;
}

/** Organization runtime data */
export interface OrgData {
  id: string;
  name: NonNullable<OrgInput["name"]>;
  slug: NonNullable<OrgInput["slug"]>;
}

/** Invitation runtime data - uses role from schema */
export interface InvitationData {
  id: string;
  email: NonNullable<InvitationInput["email"]>;
  role: InvitationInput["role"];
  token: string; // UUID token for accepting invitation
}

/** Project runtime data */
export interface ProjectData {
  id: string;
  name: NonNullable<ProjectInput["name"]>;
  createdBy: string;
}

/** Roles that can be invited (from InvitationInput) */
export type InviteRole = InvitationInput["role"];

// ===========================================
// Flow Context
// ===========================================

export interface FlowContext {
  owner: UserCredentials;
  org: OrgData;
  invitations: Map<InviteRole, InvitationData>;
  users: Map<InviteRole, UserCredentials>;
  projects: Map<string, ProjectData>;
  page: Page;
  baseUrl: string;
}

// ===========================================
// Test Data Generators
// ===========================================

export function generateEmail(prefix: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  // Use Gmail + addressing - all emails delivered to base address
  return `ont323+${prefix}-${ts}-${rand}@gmail.com`;
}

export function generatePassword(): string {
  return `TestPass${Date.now()}!`;
}

export function generateOrgName(): string {
  return `E2E Org ${Date.now()}`;
}

export function generateProjectName(suffix: string): string {
  return `Project ${suffix} ${Date.now()}`;
}
