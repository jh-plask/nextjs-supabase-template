import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Enums, Tables, TablesInsert } from "@/database.types";

// --- DB Types (for reference and alignment) ---
export type Invitation = Tables<"organization_invitations">;
export type InvitationInsert = TablesInsert<"organization_invitations">;
export type InvitationStatus = Enums<"invitation_status">;
export type OrgRole = Enums<"org_role">;

// --- Operations ---
export const operations = ["create", "accept", "revoke"] as const;
export type Operation = (typeof operations)[number];

// --- Field Names ---
export const fieldNames = ["email", "role"] as const;
export type FieldName = (typeof fieldNames)[number];

// --- Role Values (subset of org_role for invitations) ---
export const roles = [
  "admin",
  "member",
  "viewer",
] as const satisfies readonly OrgRole[];
export type Role = (typeof roles)[number];

// --- Schema (aligned with DB types) ---
export const InvitationSchema = z.object({
  operation: z.enum(operations).default("create"),
  // Fields aligned with InvitationInsert type
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(roles).default("member"),
  token: z.string().uuid("Invalid invitation token").optional(),
  invitationId: z.string().uuid("Invalid invitation ID").optional(),
});

export type InvitationInput = z.infer<typeof InvitationSchema>;

// --- Domain Context ---
export interface Context {
  supabase: SupabaseClient<Database>;
  user: User;
  orgId: string | null;
}

// --- Handler Type ---
export type Handler = (data: InvitationInput, ctx: Context) => Promise<unknown>;
