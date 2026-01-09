import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/database.types";

// --- Operations ---
export const operations = ["login", "signup", "magic-link", "logout"] as const;
export type Operation = (typeof operations)[number];

// --- Field Names ---
export const fieldNames = ["email", "password", "confirmPassword"] as const;
export type FieldName = (typeof fieldNames)[number];

// --- Schema ---
export const AuthSchema = z
  .object({
    operation: z.enum(operations).default("login"),
    email: z.string().email("Invalid email address").or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .or(z.literal("")),
    confirmPassword: z.string().or(z.literal("")),
  })
  .refine(
    ({ operation, email }) => operation === "logout" || email.length > 0,
    { message: "Email is required", path: ["email"] }
  )
  .refine(
    ({ operation, password }) =>
      !["login", "signup"].includes(operation) || password.length > 0,
    { message: "Password is required", path: ["password"] }
  )
  .refine(
    ({ operation, password, confirmPassword }) =>
      operation !== "signup" || password === confirmPassword,
    { message: "Passwords do not match", path: ["confirmPassword"] }
  );

export type AuthInput = z.infer<typeof AuthSchema>;

// --- OAuth Providers ---
export const oauthProviders = ["google"] as const;
export type OAuthProvider = (typeof oauthProviders)[number];

// --- Domain Context (auth doesn't require user) ---
export type Context = SupabaseClient<Database>;

// --- Handler Type ---
export type Handler = (data: AuthInput, ctx: Context) => Promise<unknown>;
