import type { AuthUIConfig, Operation } from "./schema";

// --- UI Config (client-safe, no server imports) ---
export const authUIConfig: Record<Operation, AuthUIConfig> = {
  login: {
    label: "Sign In",
    description: "Sign in to your account",
    fields: ["email", "password"],
    submit: { label: "Sign In", pending: "Signing in..." },
    links: [
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
  },
  signup: {
    label: "Create Account",
    description: "Create a new account",
    fields: ["email", "password", "confirmPassword"],
    submit: { label: "Create Account", pending: "Creating..." },
    links: [
      {
        href: "/auth?op=login",
        label: "Already have an account? Sign in",
        testId: "auth-link-login",
      },
    ],
  },
  "magic-link": {
    label: "Magic Link",
    description: "Sign in with a magic link sent to your email",
    fields: ["email"],
    submit: { label: "Send Magic Link", pending: "Sending..." },
    links: [
      {
        href: "/auth?op=login",
        label: "Back to sign in",
        testId: "auth-link-login",
      },
    ],
  },
  logout: {
    label: "Sign Out",
    description: "Sign out of your account",
    fields: [],
    submit: { label: "Sign Out", pending: "Signing out..." },
  },
};

// Re-export schema types for convenience
export {
  type AuthInput,
  type AuthUIConfig,
  type FieldName,
  fieldConfigs,
  type OAuthProvider,
  type Operation,
  oauthProviders,
  operations,
} from "./schema";
