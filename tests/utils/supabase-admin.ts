import { createClient } from "@supabase/supabase-js";

// Admin client with service role key for test setup
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!(url && serviceKey)) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Test user credentials - used by both setup scripts and tests
export const TEST_USER = {
  email: "e2e-test@playwright.local",
  password: "E2ETestPassword123!",
};

// Create or reset test user before tests
export async function ensureTestUser() {
  const admin = createAdminClient();

  // Check if user exists
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find(
    (u) => u.email === TEST_USER.email
  );

  if (existingUser) {
    // Update password to ensure it's correct
    await admin.auth.admin.updateUserById(existingUser.id, {
      password: TEST_USER.password,
      email_confirm: true,
    });
    console.log(`Test user updated: ${TEST_USER.email}`);
    return existingUser;
  }

  // Create new user
  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true, // Auto-confirm email
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }
  console.log(`Test user created: ${TEST_USER.email}`);
  return data.user;
}

// Clean up test user after tests
export async function deleteTestUser() {
  const admin = createAdminClient();
  const { data: users } = await admin.auth.admin.listUsers();
  const testUser = users?.users.find((u) => u.email === TEST_USER.email);

  if (testUser) {
    await admin.auth.admin.deleteUser(testUser.id);
    console.log(`Test user deleted: ${TEST_USER.email}`);
  } else {
    console.log(`Test user not found: ${TEST_USER.email}`);
  }
}

// Clean up all test users (those matching the pattern)
export async function cleanupAllTestUsers() {
  const admin = createAdminClient();
  const { data: users } = await admin.auth.admin.listUsers();

  const testUsers =
    users?.users.filter(
      (u) =>
        u.email?.endsWith("@playwright.local") || u.email?.includes("e2e-test")
    ) ?? [];

  for (const user of testUsers) {
    await admin.auth.admin.deleteUser(user.id);
    console.log(`Deleted test user: ${user.email}`);
  }

  console.log(`Cleaned up ${testUsers.length} test user(s)`);
}
