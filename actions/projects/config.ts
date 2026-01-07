import { z } from "zod";
import type { FieldConfig, FormUIConfig } from "@/lib/form-config";
import type { OperationTestPlan } from "@/lib/test-types";

// ============================================
// Field Definitions (Schema + UI unified)
// ============================================

/**
 * Field names as const tuple for type derivation.
 */
export const projectFieldNames = ["name", "description"] as const;
export type ProjectFieldName = (typeof projectFieldNames)[number];

/**
 * Field configurations with both validation and UI.
 */
export const projectFields = {
  name: {
    schema: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(100, { message: "Name must be at most 100 characters" })
      .optional(),
    ui: {
      label: "Name",
      type: "text" as const,
      placeholder: "Project name",
    },
  },
  description: {
    schema: z
      .string()
      .max(500, { message: "Description must be at most 500 characters" })
      .optional()
      .nullable(),
    ui: {
      label: "Description",
      type: "text" as const,
      placeholder: "Optional description",
    },
  },
} as const;

// ============================================
// Operation Definitions
// ============================================

export const projectOperationNames = [
  "create",
  "list",
  "update",
  "delete",
] as const;
export type ProjectOperation = (typeof projectOperationNames)[number];

/**
 * Operation configurations with UI and test data.
 * Handlers are attached separately in logic/index.ts.
 */
export const projectOperations = {
  create: {
    fields: ["name", "description"] as ProjectFieldName[],
    submit: { label: "Create", pending: "Creating..." },
    description: "Add a new project to your organization.",
    icon: "plus-circle",
    test: {
      valid: { name: "Test Project" },
      invalid: { name: "X" },
      success: /success|created/i,
      error: /at least 2 characters/i,
      db: [
        { table: "projects", op: "insert", match: { name: "Test Project" } },
      ],
    } satisfies OperationTestPlan<ProjectFieldName>,
  },
  list: {
    fields: [] as ProjectFieldName[],
    submit: { label: "Refresh", pending: "Loading..." },
    description: "List all projects in this organization.",
    icon: "list",
  },
  update: {
    fields: ["name", "description"] as ProjectFieldName[],
    submit: { label: "Save", pending: "Saving..." },
    description: "Update project details.",
    icon: "pencil",
    test: {
      valid: { name: "Updated Project" },
      invalid: { name: "" },
      success: /success|updated/i,
      error: /required/i,
      db: [
        { table: "projects", op: "update", match: { name: "Updated Project" } },
      ],
    } satisfies OperationTestPlan<ProjectFieldName>,
  },
  delete: {
    fields: [] as ProjectFieldName[],
    submit: { label: "Delete", pending: "Deleting..." },
    description: "This action cannot be undone.",
    icon: "trash-2",
    confirmMessage:
      "Are you sure you want to delete this project? This action cannot be undone.",
    test: {
      valid: {},
      success: /success|deleted/i,
      db: [{ table: "projects", op: "delete", expectCount: 0 }],
    } satisfies OperationTestPlan<ProjectFieldName>,
  },
} as const;

// ============================================
// Derived Configurations
// ============================================

/**
 * Field configs for ConfigDrivenForm/Dialog.
 */
export const projectFieldConfigs: Record<ProjectFieldName, FieldConfig> = {
  name: projectFields.name.ui,
  description: projectFields.description.ui,
};

/**
 * Form UI configs per operation.
 */
export const projectFormConfigs = {
  create: {
    label: "Create Project",
    description: projectOperations.create.description,
    fields: projectOperations.create.fields,
    submit: projectOperations.create.submit,
  },
  list: {
    label: "Projects",
    description: projectOperations.list.description,
    fields: projectOperations.list.fields,
    submit: projectOperations.list.submit,
  },
  update: {
    label: "Edit Project",
    description: projectOperations.update.description,
    fields: projectOperations.update.fields,
    submit: projectOperations.update.submit,
  },
  delete: {
    label: "Delete Project",
    description: projectOperations.delete.description,
    fields: projectOperations.delete.fields,
    submit: projectOperations.delete.submit,
  },
} satisfies Record<ProjectOperation, FormUIConfig<ProjectFieldName>>;

/**
 * Test plans per operation (extracted for E2E tests).
 */
export const projectTestPlans: Partial<
  Record<ProjectOperation, OperationTestPlan<ProjectFieldName>>
> = {
  create: projectOperations.create.test,
  update: projectOperations.update.test,
  delete: projectOperations.delete.test,
};
