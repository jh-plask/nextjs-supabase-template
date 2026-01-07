/**
 * Creates a test user for E2E tests.
 * Run before tests in CI: pnpm exec tsx tests/setup/create-test-user.ts
 */
import { ensureTestUser } from "../utils/supabase-admin";

async function main() {
  try {
    await ensureTestUser();
    process.exit(0);
  } catch (error) {
    console.error("Failed to create test user:", error);
    process.exit(1);
  }
}

main();
