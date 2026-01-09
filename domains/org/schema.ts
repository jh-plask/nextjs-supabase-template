import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Tables, TablesInsert } from "@/database.types";

// --- DB Types (for reference and alignment) ---
export type Organization = Tables<"organizations">;
export type OrganizationInsert = TablesInsert<"organizations">;

// --- Operations ---
export const operations = ["create", "update", "switch", "delete"] as const;
export type Operation = (typeof operations)[number];

// --- Field Names ---
export const fieldNames = ["name", "slug"] as const;
export type FieldName = (typeof fieldNames)[number];

// --- Schema (aligned with DB types) ---
export const OrgSchema = z.object({
  operation: z.enum(operations).default("create"),
  orgId: z.uuid("Invalid organization ID").optional(),
  // Fields aligned with OrganizationInsert type
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50)
    .optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only"
    )
    .optional()
    .or(z.literal("")),
  logoUrl: z.url("Invalid URL format").optional().nullable(),
});

export type OrgInput = z.infer<typeof OrgSchema>;

// --- Domain Context ---
export interface Context {
  supabase: SupabaseClient<Database>;
  user: User;
  orgId: string | null;
}

// --- Handler Type ---
export type Handler = (data: OrgInput, ctx: Context) => Promise<unknown>;
