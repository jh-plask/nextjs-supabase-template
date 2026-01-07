/**
 * E2E Flow Test - DAG-based Full Flow Testing
 *
 * Tests complete user flows including:
 * - Auth (signup, login)
 * - Organizations (create)
 * - Projects (create, permissions)
 * - Invitations (invite, accept)
 * - RBAC (role-based permissions)
 *
 * All tests use action configs for UI selectors.
 */

import { expect, test } from "@playwright/test";
import { ORG_ROLES } from "@/lib/rbac/permissions";
import type { FlowContext } from "./context";
import { TestDAG } from "./dag";
import { allNodes } from "./nodes";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("E2E Flow (DAG)", () => {
  // This test runs multiple user flows sequentially and needs more time
  // Includes delays for Supabase auth rate limits
  test.setTimeout(180_000);

  test("complete flow tests all domains and permissions", async ({ page }) => {
    // Build DAG from nodes
    const dag = new TestDAG();
    dag.addAll(allNodes);

    // Initialize context
    const ctx: FlowContext = {
      owner: { email: "", password: "" },
      org: { id: "", name: "", slug: "" },
      invitations: new Map(),
      users: new Map(),
      projects: new Map(),
      page,
      baseUrl: BASE_URL,
    };

    // Log structure
    console.log(`\n${dag.visualize()}`);
    console.log(`\nTesting roles: ${ORG_ROLES.join(", ")}`);
    console.log("Permission matrix from lib/rbac/permissions.ts\n");

    // Execute
    const result = await dag.execute(ctx);

    // Report
    console.log("\n═══════════════════════════════════════════");
    console.log("📊 E2E Flow Results");
    console.log("═══════════════════════════════════════════");
    console.log(`✅ Passed: ${result.passed.length}`);
    console.log(`❌ Failed: ${result.failed.length}`);
    console.log(`⏭️  Skipped: ${result.skipped.length}`);
    console.log(`⏱️  Duration: ${result.duration}ms`);

    if (result.failed.length > 0) {
      console.log("\nFailed:");
      for (const { id, error } of result.failed) {
        console.log(`  - ${id}: ${error.message}`);
      }
    }

    expect(result.failed.length).toBe(0);
    expect(result.skipped.length).toBe(0);
  });
});
