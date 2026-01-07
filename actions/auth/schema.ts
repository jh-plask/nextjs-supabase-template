import { z } from "zod";
import type { FieldConfig, FormUIConfig, LinkConfig } from "@/lib/form-config";

// --- Operations ---
export const operations = ["login", "signup", "magic-link", "logout"] as const;
export type Operation = (typeof operations)[number];

// --- Field Config ---
export const fieldNames = ["email", "password", "confirmPassword"] as const;
export type FieldName = (typeof fieldNames)[number];

export const fieldConfigs: Record<FieldName, FieldConfig> = {
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
};

// --- Validation Rules ---
const requiredFields: Record<Operation, FieldName[]> = {
  login: ["email", "password"],
  signup: ["email", "password", "confirmPassword"],
  "magic-link": ["email"],
  logout: [],
};

// --- Schema ---
export const AuthSchema = z
  .object({
    operation: z.enum(operations),
    email: z.string().optional().or(z.literal("")),
    password: z.string().optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const required = requiredFields[data.operation];
    const addError = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });

    if (required.includes("email")) {
      if (!data.email) {
        addError("email", "Email is required");
      } else if (!data.email.includes("@")) {
        addError("email", "Invalid email address");
      }
    }
    if (required.includes("password")) {
      if (!data.password) {
        addError("password", "Password is required");
      } else if (data.password.length < 8) {
        addError("password", "Password must be at least 8 characters");
      }
    }
    if (
      required.includes("confirmPassword") &&
      data.password !== data.confirmPassword
    ) {
      addError("confirmPassword", "Passwords do not match");
    }
  });

export type AuthInput = z.infer<typeof AuthSchema>;

// --- Operation Config (extends FormUIConfig with auth-specific fields) ---
export interface AuthUIExtensions {
  links?: (LinkConfig & { testId: string })[];
}

export type AuthUIConfig = FormUIConfig<FieldName> & AuthUIExtensions;

export type AuthOperationConfig = AuthUIConfig & {
  handler: (data: AuthInput) => Promise<unknown>;
};

export type AuthDomain = { [K in Operation]: AuthOperationConfig };

// --- OAuth Provider Config ---
export const oauthProviders = ["google"] as const;
export type OAuthProvider = (typeof oauthProviders)[number];
