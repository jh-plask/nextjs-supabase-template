import { z } from "zod";

// ============================================
// Organization Schema
// ============================================

export const OrgSchema = z.object({
  operation: z
    .enum(["create", "update", "switch", "delete"], {
      message: "Please select a valid operation",
    })
    .default("create"),

  // Organization ID (required for update, switch, delete)
  orgId: z.string().uuid({ message: "Invalid organization ID" }).optional(),

  // Organization name (required for create, update)
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name must be at most 50 characters" })
    .optional(),

  // Organization slug (optional, auto-generated if not provided)
  slug: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(
      z
        .string()
        .min(2, { message: "Slug must be at least 2 characters" })
        .max(50, { message: "Slug must be at most 50 characters" })
        .regex(/^[a-z0-9-]+$/, {
          message: "Slug must be lowercase letters, numbers, and hyphens only",
        })
        .optional()
    ),

  // Logo URL (optional)
  logoUrl: z
    .string()
    .url({ message: "Invalid URL format" })
    .optional()
    .nullable(),
});

// ============================================
// Types
// ============================================

export type OrgInput = z.infer<typeof OrgSchema>;
export type Operation = OrgInput["operation"];

// ============================================
// Domain Config Interface
// ============================================

export interface OperationConfig {
  handler: (data: OrgInput) => Promise<unknown>;
  label: string;
  description: string;
  icon: string;
  confirmMessage?: string;
}

export type OrgDomain = Record<Operation, OperationConfig>;
