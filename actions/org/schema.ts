import { z } from "zod";
import { orgFields, orgOperationNames } from "./config";

// ============================================
// Organization Schema
// ============================================

export const OrgSchema = z.object({
  operation: z
    .enum(orgOperationNames, {
      message: "Please select a valid operation",
    })
    .default("create"),

  // Organization ID (required for update, switch, delete)
  orgId: z.string().uuid({ message: "Invalid organization ID" }).optional(),

  // Fields from unified config
  name: orgFields.name.schema,
  slug: orgFields.slug.schema,

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
