import { z } from "zod";

// --- Operations ---
export const operations = ["login", "signup", "magic-link", "logout"] as const;
export type Operation = (typeof operations)[number];

// --- Field Names ---
export const fieldNames = ["email", "password", "confirmPassword"] as const;
export type FieldName = (typeof fieldNames)[number];

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

// --- OAuth Providers ---
export const oauthProviders = ["google"] as const;
export type OAuthProvider = (typeof oauthProviders)[number];
