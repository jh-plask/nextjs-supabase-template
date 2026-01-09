import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Tables, TablesInsert } from "@/database.types";

// --- DB Types (for reference and alignment) ---
export type Project = Tables<"projects">;
export type ProjectInsert = TablesInsert<"projects">;

// --- Operations ---
export const operations = ["create", "list", "update", "delete"] as const;
export type Operation = (typeof operations)[number];

// --- Field Names ---
export const fieldNames = ["name", "description"] as const;
export type FieldName = (typeof fieldNames)[number];

// --- Schema (aligned with DB types) ---
export const ProjectSchema = z.object({
  operation: z.enum(operations).default("list"),
  projectId: z.string().uuid("Invalid project ID").optional(),
  // Fields aligned with ProjectInsert type
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;

// --- Domain Context ---
export interface Context {
  supabase: SupabaseClient<Database>;
  user: User;
  orgId: string;
}

// --- Handler Type ---
export type Handler = (data: ProjectInput, ctx: Context) => Promise<unknown>;
