import { z } from "zod";
import { projectFields, projectOperationNames } from "./config";

// ============================================
// Project Schema
// ============================================

export const ProjectSchema = z.object({
  operation: z
    .enum(projectOperationNames, {
      message: "Please select a valid operation",
    })
    .default("list"),

  // Project ID (required for update, delete)
  projectId: z.string().uuid({ message: "Invalid project ID" }).optional(),

  // Fields from unified config
  name: projectFields.name.schema,
  description: projectFields.description.schema,
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
