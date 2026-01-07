/**
 * Cleans up test users after E2E tests.
 * Run after tests in CI: pnpm exec tsx tests/setup/cleanup-test-user.ts
 */
import { cleanupAllTestUsers } from "../utils/supabase-admin";

async function main() {
  try {
    await cleanupAllTestUsers();
    process.exit(0);
  } catch (error) {
    console.error("Failed to cleanup test users:", error);
    // Don't fail the CI pipeline if cleanup fails
    process.exit(0);
  }
}

main();
