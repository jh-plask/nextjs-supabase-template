import { expect, type Page, test } from "@playwright/test";
import { orgTestPlan } from "./plans/org";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Regex patterns (hoisted to module scope for performance)
const DASHBOARD_URL_PATTERN = /\/dashboard/;
const ORG_NAME_LABEL_PATTERN = /organization name/i;
const CREATE_BUTTON_PATTERN = /create/i;
const ORG_SETTINGS_URL_PATTERN = /\/dashboard\/org\/settings/;
const ORG_SETTINGS_GROUP_PATTERN = /organization settings/i;

// Test user from env - same as auth tests
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "ont323@gmail.com",
  password: process.env.TEST_USER_PASSWORD || "test-password",
};

// Login helper
async function loginTestUser(page: Page) {
  await page.goto(`${BASE_URL}/auth?op=login`);
  // Wait for form to be ready
  await expect(page.getByTestId("auth-field-email")).toBeVisible({
    timeout: 10_000,
  });
  await page.getByTestId("auth-field-email").fill(TEST_USER.email);
  await page.getByTestId("auth-field-password").fill(TEST_USER.password);
  await page.getByTestId("auth-submit-login").click();
  await expect(page).toHaveURL(DASHBOARD_URL_PATTERN, { timeout: 15_000 });
}

// Navigate to org management
async function navigateToOrgPage(page: Page, path = "") {
  await page.goto(`${BASE_URL}/dashboard/org${path}`);
}

test.describe("Organization Actions", () => {
  test.describe("Create Organization", () => {
    const plan = orgTestPlan.create;

    test("creates org with valid input", async ({ page }) => {
      await loginTestUser(page);
      await navigateToOrgPage(page, "/new");

      // Fill form
      await page.getByLabel(ORG_NAME_LABEL_PATTERN).fill(plan.valid.name);
      await page.getByRole("button", { name: CREATE_BUTTON_PATTERN }).click();

      // Verify redirected to dashboard (success)
      if (plan.redirectTo) {
        await expect(page).toHaveURL(new RegExp(plan.redirectTo), {
          timeout: 10_000,
        });
      }
    });

    test("shows error with invalid input", async ({ page }) => {
      if (!(plan.invalid?.name && plan.errorMessage)) {
        test.skip();
        return;
      }

      await loginTestUser(page);
      await navigateToOrgPage(page, "/new");

      // Fill with invalid data
      await page.getByLabel(ORG_NAME_LABEL_PATTERN).fill(plan.invalid.name);
      await page.getByRole("button", { name: CREATE_BUTTON_PATTERN }).click();

      // Verify error
      await expect(page.getByText(plan.errorMessage)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Switch Organization", () => {
    test("switches to different org via dropdown", async ({ page }) => {
      await loginTestUser(page);

      // First, verify we have multiple orgs by opening the switcher
      await page.getByTestId("org-switcher-trigger").click();

      // Look for any org item that's not currently selected (no bg-accent)
      const orgItems = page.locator("[data-testid^='org-item-']");
      const count = await orgItems.count();

      if (count < 2) {
        test.skip(true, "Need at least 2 orgs for switch test");
        return;
      }

      // Get the current org name
      const currentOrgName = await page
        .getByTestId("org-switcher-trigger")
        .textContent();

      // Click on a different org
      for (let i = 0; i < count; i++) {
        const item = orgItems.nth(i);
        const itemText = await item.textContent();
        if (itemText && !itemText.includes(currentOrgName?.trim() || "")) {
          await item.click();
          break;
        }
      }

      // Wait for switch to complete
      await page.waitForTimeout(2000);

      // Verify the org switcher shows a different name
      const newOrgName = await page
        .getByTestId("org-switcher-trigger")
        .textContent();
      expect(newOrgName).not.toBe(currentOrgName);
    });
  });

  test.describe("Organization Settings", () => {
    test("owner can access settings", async ({ page }) => {
      await loginTestUser(page);

      // Navigate directly to org settings (JWT claims may not be populated without hook enabled)
      await page.goto(`${BASE_URL}/dashboard/org/settings`);

      // Should be on settings page (not redirected)
      await expect(page).toHaveURL(ORG_SETTINGS_URL_PATTERN, {
        timeout: 10_000,
      });

      // Page should show settings form (Organization Settings fieldset)
      await expect(
        page.getByRole("group", { name: ORG_SETTINGS_GROUP_PATTERN })
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Member Management", () => {
    test("displays members page for current org", async ({ page }) => {
      await loginTestUser(page);
      await page.goto(`${BASE_URL}/dashboard/org/members`);

      // Should see at least the current user
      await expect(page.getByText(TEST_USER.email)).toBeVisible();
    });
  });
});

// RBAC Permission Tests
test.describe("RBAC Permissions", () => {
  test.describe("Tenant Isolation", () => {
    test.fixme("user cannot see other org's data", async () => {
      // TODO: Create two users in different orgs
      // Verify user A cannot see user B's org resources
    });
  });

  test.describe("Role-Based Access", () => {
    test.fixme("viewer cannot create projects", async () => {
      // TODO: Create user with viewer role
      // Verify they cannot access create actions
    });

    test.fixme("member can create projects", async () => {
      // TODO: Create user with member role
      // Verify they can create projects
    });

    test.fixme("admin can manage members", async () => {
      // TODO: Create user with admin role
      // Verify they can invite/remove members
    });
  });
});
