import { createDomain } from "@/lib/domain";
import type { LinkConfig } from "@/lib/form-config";
import { logoutAction, processAuth } from "./action";
import {
  AuthSchema,
  type FieldName,
  fieldNames,
  type Operation,
  oauthProviders,
  operations,
} from "./schema";

// --- Auth Domain ---
export const authDomain = createDomain<FieldName, Operation, typeof AuthSchema>(
  {
    name: "auth",
    action: processAuth,
    schema: AuthSchema,

    fields: {
      email: {
        label: "Email",
        type: "email",
        placeholder: "you@example.com",
        autoComplete: "email",
      },
      password: {
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
        autoComplete: "current-password",
      },
      confirmPassword: {
        label: "Confirm Password",
        type: "password",
        placeholder: "Confirm your password",
        autoComplete: "new-password",
      },
    },

    operations: {
      login: {
        label: "Sign In",
        description: "Sign in to your account",
        fields: ["email", "password"],
        submit: { label: "Sign In", pending: "Signing in..." },
      },
      signup: {
        label: "Create Account",
        description: "Create a new account",
        fields: ["email", "password", "confirmPassword"],
        submit: { label: "Create Account", pending: "Creating..." },
      },
      "magic-link": {
        label: "Magic Link",
        description: "Sign in with a magic link sent to your email",
        fields: ["email"],
        submit: { label: "Send Magic Link", pending: "Sending..." },
      },
      logout: {
        label: "Sign Out",
        description: "Sign out of your account",
        fields: [],
        submit: { label: "Sign Out", pending: "Signing out..." },
      },
    },
  }
);

// --- Auth-specific UI Extensions (links for each operation) ---
export interface AuthLinkConfig extends LinkConfig {
  testId: string;
}

export const authLinks: Record<Operation, AuthLinkConfig[]> = {
  login: [
    {
      href: "/auth?op=signup",
      label: "Don't have an account? Sign up",
      testId: "auth-link-signup",
    },
    {
      href: "/auth?op=magic-link",
      label: "Sign in with magic link",
      testId: "auth-link-magic-link",
    },
  ],
  signup: [
    {
      href: "/auth?op=login",
      label: "Already have an account? Sign in",
      testId: "auth-link-login",
    },
  ],
  "magic-link": [
    {
      href: "/auth?op=login",
      label: "Back to sign in",
      testId: "auth-link-login",
    },
  ],
  logout: [],
};

// --- Re-exports ---
export { logoutAction };
export type { FieldName, Operation };
export { fieldNames, operations, oauthProviders };
export type AuthDomain = typeof authDomain;
