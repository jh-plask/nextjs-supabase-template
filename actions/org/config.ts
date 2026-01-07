import { z } from "zod";
import type { FieldConfig, FormUIConfig } from "@/lib/form-config";
import type { OperationTestPlan } from "@/lib/test-types";

// ============================================
// Field Definitions (Schema + UI unified)
// ============================================

/**
 * Field names as const tuple for type derivation.
 */
export const orgFieldNames = ["name", "slug"] as const;
export type OrgFieldName = (typeof orgFieldNames)[number];

/**
 * Field configurations with both validation and UI.
 */
export const orgFields = {
  name: {
    schema: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(50, { message: "Name must be at most 50 characters" })
      .optional(),
    ui: {
      label: "Organization Name",
      type: "text" as const,
      placeholder: "Acme Inc.",
    },
  },
  slug: {
    schema: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .pipe(
        z
          .string()
          .min(2, { message: "Slug must be at least 2 characters" })
          .max(50, { message: "Slug must be at most 50 characters" })
          .regex(/^[a-z0-9-]+$/, {
            message:
              "Slug must be lowercase letters, numbers, and hyphens only",
          })
          .optional()
      ),
    ui: {
      label: "Slug (optional)",
      type: "text" as const,
      placeholder: "acme-inc",
      description: "URL-friendly identifier. Auto-generated if not provided.",
    },
  },
} as const;

// ============================================
// Operation Definitions
// ============================================

export const orgOperationNames = [
  "create",
  "update",
  "switch",
  "delete",
] as const;
export type OrgOperation = (typeof orgOperationNames)[number];

/**
 * Operation configurations with UI and test data.
 * Handlers are attached separately in logic/index.ts.
 */
export const orgOperations = {
  create: {
    fields: ["name", "slug"] as OrgFieldName[],
    submit: { label: "Create Organization", pending: "Creating..." },
    description: "Create a new organization to collaborate with your team.",
    icon: "plus-circle",
    test: {
      valid: { name: "Test Organization" },
      invalid: { name: "X" },
      success: /success|created/i,
      error: /at least 2 characters/i,
      redirectTo: "/dashboard",
      db: [
        {
          table: "organizations",
          op: "insert",
          match: { name: "Test Organization" },
        },
        {
          table: "organization_members",
          op: "insert",
          match: { role: "owner" },
        },
      ],
    } satisfies OperationTestPlan<OrgFieldName>,
  },
  update: {
    fields: ["name", "slug"] as OrgFieldName[],
    submit: { label: "Save Changes", pending: "Saving..." },
    description: "Update your organization details.",
    icon: "settings",
    test: {
      valid: { name: "Updated Organization Name" },
      invalid: { name: "" },
      success: /success|updated/i,
      error: /required/i,
      db: [
        {
          table: "organizations",
          op: "update",
          match: { name: "Updated Organization Name" },
        },
      ],
    } satisfies OperationTestPlan<OrgFieldName>,
  },
  switch: {
    fields: [] as OrgFieldName[],
    submit: { label: "Switch", pending: "Switching..." },
    description: "Switch to a different organization.",
    icon: "arrow-right-left",
    test: {
      valid: {},
      success: /success|switched/i,
      db: [{ table: "user_preferences", op: "update" }],
    } satisfies OperationTestPlan<OrgFieldName>,
  },
  delete: {
    fields: [] as OrgFieldName[],
    submit: { label: "Delete", pending: "Deleting..." },
    description: "Permanently delete this organization and all its data.",
    icon: "trash-2",
    confirmMessage:
      "Are you sure you want to delete this organization? This action cannot be undone.",
    test: {
      valid: {},
      success: /success|deleted/i,
      db: [{ table: "organizations", op: "delete", expectCount: 0 }],
    } satisfies OperationTestPlan<OrgFieldName>,
  },
} as const;

// ============================================
// Derived Configurations
// ============================================

/**
 * Field configs for ConfigDrivenForm/Dialog.
 */
export const orgFieldConfigs: Record<OrgFieldName, FieldConfig> = {
  name: orgFields.name.ui,
  slug: orgFields.slug.ui,
};

/**
 * Form UI configs per operation.
 */
export const orgFormConfigs = {
  create: {
    label: orgOperations.create.description,
    description: orgOperations.create.description,
    fields: orgOperations.create.fields,
    submit: orgOperations.create.submit,
  },
  update: {
    label: "Organization Settings",
    description: orgOperations.update.description,
    fields: orgOperations.update.fields,
    submit: orgOperations.update.submit,
  },
  switch: {
    label: "Switch Organization",
    description: orgOperations.switch.description,
    fields: orgOperations.switch.fields,
    submit: orgOperations.switch.submit,
  },
  delete: {
    label: "Delete Organization",
    description: orgOperations.delete.description,
    fields: orgOperations.delete.fields,
    submit: orgOperations.delete.submit,
  },
} satisfies Record<OrgOperation, FormUIConfig<OrgFieldName>>;

/**
 * Test plans per operation (extracted for E2E tests).
 */
export const orgTestPlans = {
  create: orgOperations.create.test,
  update: orgOperations.update.test,
  switch: orgOperations.switch.test,
  delete: orgOperations.delete.test,
} satisfies Record<OrgOperation, OperationTestPlan<OrgFieldName>>;
