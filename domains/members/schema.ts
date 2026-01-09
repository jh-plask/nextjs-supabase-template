import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Enums, Tables } from "@/database.types";

// --- DB Types (for reference and alignment) ---
export type Member = Tables<"organization_members">;
export type Role = Enums<"org_role">;

// --- Operations ---
export const operations = ["add", "remove", "update-role"] as const;
export type Operation = (typeof operations)[number];

// --- Field Names ---
export const fieldNames = ["email", "role"] as const;
export type FieldName = (typeof fieldNames)[number];

// --- Role Values (from DB enum) ---
export const roles = [
  "owner",
  "admin",
  "member",
  "viewer",
] as const satisfies readonly Role[];

// --- Schema (aligned with DB types) ---
export const MemberSchema = z.object({
  operation: z.enum(operations).default("add"),
  // IDs match DB uuid types
  memberId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  // Fields for form input
  email: z.string().email().optional(),
  role: z.enum(roles).optional(),
});

export type MemberInput = z.infer<typeof MemberSchema>;

// --- Domain Context ---
export interface Context {
  supabase: SupabaseClient<Database>;
  user: User;
  orgId: string;
}

// --- Handler Type ---
export type Handler = (data: MemberInput, ctx: Context) => Promise<unknown>;
