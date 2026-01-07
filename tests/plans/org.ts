import { type Operation, orgConfig } from "@/actions/org/logic";
import type { DbEffect } from "./auth";

// --- Test Plan Interface ---
export interface OrgOperationTestPlan {
  valid: Record<string, string>;
  invalid?: Record<string, string>;
  successMessage?: RegExp;
  errorMessage?: RegExp;
  redirectTo?: string;
  db: DbEffect[];
  // For operations that require existing data
  setup?: () => Promise<Record<string, string>>;
  cleanup?: () => Promise<void>;
}

// --- Org Test Plan ---
export const orgTestPlan: Record<Operation, OrgOperationTestPlan> = {
  create: {
    valid: { name: "Test Organization" },
    invalid: { name: "X" }, // Too short (min 2 chars)
    successMessage: /success|created/i,
    errorMessage: /at least 2 characters/i,
    redirectTo: "/dashboard",
    db: [
      {
        table: "organizations",
        op: "insert",
        match: { name: "Test Organization" },
      },
      {
        table: "organization_members",
        op: "insert",
        match: { role: "owner" },
      },
    ],
  },
  update: {
    valid: { name: "Updated Organization Name" },
    invalid: { name: "" },
    successMessage: /success|updated/i,
    errorMessage: /required/i,
    db: [
      {
        table: "organizations",
        op: "update",
        match: { name: "Updated Organization Name" },
      },
    ],
  },
  switch: {
    valid: {}, // orgId will be dynamically set in tests
    successMessage: /success|switched/i,
    db: [
      {
        table: "user_preferences",
        op: "update",
      },
    ],
  },
  delete: {
    valid: {}, // orgId will be dynamically set in tests
    successMessage: /success|deleted/i,
    db: [
      {
        table: "organizations",
        op: "delete",
        expectCount: 0,
      },
    ],
  },
};

// Type safety: ensure plan keys match config keys
const _typeCheck: Operation[] = Object.keys(orgConfig) as Operation[];
void _typeCheck;
