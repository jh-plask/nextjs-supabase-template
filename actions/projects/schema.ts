import { z } from "zod";

// ============================================
// Project Schema
// ============================================

export const ProjectSchema = z.object({
  operation: z
    .enum(["create", "list", "update", "delete"], {
      message: "Please select a valid operation",
    })
    .default("list"),

  // Project ID (required for update, delete)
  projectId: z.string().uuid({ message: "Invalid project ID" }).optional(),

  // Project name (required for create, update)
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be at most 100 characters" })
    .optional(),

  // Project description (optional)
  description: z
    .string()
    .max(500, { message: "Description must be at most 500 characters" })
    .optional()
    .nullable(),
});

// ============================================
// Types
// ============================================

export type ProjectInput = z.infer<typeof ProjectSchema>;
export type Operation = ProjectInput["operation"];

// ============================================
// Domain Config Interface
// ============================================

export interface OperationConfig {
  handler: (data: ProjectInput) => Promise<unknown>;
  label: string;
  description: string;
  icon: string;
  confirmMessage?: string;
}

export type ProjectDomain = Record<Operation, OperationConfig>;
