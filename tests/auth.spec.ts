import { expect, type Page, test } from "@playwright/test";
import type { Operation } from "@/actions/auth/config";
import { authTestPlan, type OperationTestPlan } from "./plans/auth";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const AUTH_LOGIN_URL_PATTERN = /\/auth\?op=login/;
const DASHBOARD_URL_PATTERN = /\/dashboard/;

async function fillAuthForm(
  page: Page,
  operation: Operation,
  data: Record<string, string>
) {
  await page.goto(`${BASE_URL}/auth?op=${operation}`);
  for (const [field, value] of Object.entries(data)) {
    const input = page.getByTestId(`auth-field-${field}`);
    if (await input.isVisible()) {
      await input.fill(value);
    }
  }
}

test.describe("Auth Flow", () => {
  test.describe("Valid Inputs", () => {
    for (const [op, plan] of Object.entries(authTestPlan) as [
      Operation,
      OperationTestPlan,
    ][]) {
      if (op === "logout") {
        continue;
      }

      test(`${op}: submits with valid input`, async ({ page }) => {
        await fillAuthForm(page, op, plan.valid);
        await page.getByTestId(`auth-submit-${op}`).click();

        if (plan.successMessage) {
          await expect(page.getByText(plan.successMessage)).toBeVisible({
            timeout: 10_000,
          });
        }
        if (plan.redirectTo) {
          await expect(page).toHaveURL(new RegExp(plan.redirectTo), {
            timeout: 10_000,
          });
        }
      });
    }
  });

  test.describe("Invalid Inputs", () => {
    for (const [op, plan] of Object.entries(authTestPlan) as [
      Operation,
      OperationTestPlan,
    ][]) {
      if (!plan.invalid || op === "logout") {
        continue;
      }

      test(`${op}: shows error with invalid input`, async ({ page }) => {
        await fillAuthForm(page, op, plan.invalid!);
        await page.getByTestId(`auth-submit-${op}`).click();

        if (plan.errorMessage) {
          await expect(page.getByText(plan.errorMessage)).toBeVisible({
            timeout: 5000,
          });
        }
      });
    }
  });

  test.describe("Navigation", () => {
    test("login has signup link", async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?op=login`);
      await expect(page.getByTestId("auth-link-signup")).toBeVisible();
    });

    test("signup has login link", async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?op=signup`);
      await expect(page.getByTestId("auth-link-login")).toBeVisible();
    });

    test("login has magic-link option", async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?op=login`);
      await expect(page.getByTestId("auth-link-magic-link")).toBeVisible();
    });
  });

  test.describe("OAuth", () => {
    test("Google button visible on login", async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?op=login`);
      await expect(page.getByTestId("auth-oauth-google")).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("dashboard redirects to login", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(AUTH_LOGIN_URL_PATTERN);
    });
  });

  test.describe("Logout", () => {
    test("logout redirects to login page", async ({ page }) => {
      // First login
      const loginPlan = authTestPlan.login;
      await fillAuthForm(page, "login", loginPlan.valid);
      await page.getByTestId("auth-submit-login").click();
      await expect(page).toHaveURL(DASHBOARD_URL_PATTERN, { timeout: 10_000 });

      // Then logout
      await page.getByTestId("auth-logout-button").click();
      await expect(page).toHaveURL(AUTH_LOGIN_URL_PATTERN, { timeout: 10_000 });
    });
  });
});
