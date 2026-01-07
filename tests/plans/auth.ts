/**
 * Auth Test Plans
 *
 * Authentication operations test data with type-safe field references.
 */

import { authUIConfig, type Operation } from "@/actions/auth/config";
import type { DbEffect, OperationTestPlan } from "@/lib/test-types";

// Test user credentials
// In CI: use admin-created user (e2e-test@playwright.local)
// Locally: use existing confirmed user (ont323@gmail.com)
const TEST_USER = process.env.CI
  ? { email: "e2e-test@playwright.local", password: "E2ETestPassword123!" }
  : { email: "ont323@gmail.com", password: "kkang63920" };

// Re-export types for backwards compatibility
export type { DbEffect, OperationTestPlan };

// Auth field names
type AuthFieldName = "email" | "password" | "confirmPassword";

// --- Auth Test Plan ---
export const authTestPlan: Record<
  Operation,
  OperationTestPlan<AuthFieldName>
> = {
  login: {
    valid: { email: TEST_USER.email, password: TEST_USER.password },
    invalid: { email: "test@test.com", password: "short" },
    error: /Password must be at least 8 characters/i,
    redirectTo: "/dashboard",
    db: [],
  },
  signup: {
    valid: {
      email: "new@example.com",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    },
    invalid: {
      email: "new@example.com",
      password: "NewPassword123",
      confirmPassword: "Different",
    },
    success: /check your email|confirm/i,
    error: /passwords do not match/i,
    db: [
      {
        table: "auth.users",
        op: "insert",
        match: { email: "new@example.com" },
      },
    ],
  },
  "magic-link": {
    valid: { email: "magic@example.com" },
    invalid: { email: "" },
    // Note: successMessage test requires Supabase to accept the email domain
    error: /Email is required/i,
    db: [],
  },
  logout: {
    valid: {},
    redirectTo: "/auth?op=login",
    db: [],
  },
};

// Type safety: ensure plan keys match config keys
const _typeCheck: Operation[] = Object.keys(authUIConfig) as Operation[];
void _typeCheck;
