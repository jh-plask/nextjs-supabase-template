import type { FieldConfig, FormUIConfig } from "@/lib/form-config";

// ============================================
// Field Names Type
// ============================================

export type ProjectFieldName = "name" | "description";

// ============================================
// Field Configs
// ============================================

export const projectFieldConfigs: Record<ProjectFieldName, FieldConfig> = {
  name: {
    label: "Name",
    type: "text",
    placeholder: "Project name",
  },
  description: {
    label: "Description",
    type: "text",
    placeholder: "Optional description",
  },
};

// ============================================
// Form UI Configs
// ============================================

export const projectFormConfigs = {
  create: {
    label: "Create Project",
    description: "Add a new project to your organization.",
    fields: ["name", "description"] as ProjectFieldName[],
    submit: { label: "Create", pending: "Creating..." },
  },
  update: {
    label: "Edit Project",
    description: "Update project details.",
    fields: ["name", "description"] as ProjectFieldName[],
    submit: { label: "Save", pending: "Saving..." },
  },
  delete: {
    label: "Delete Project",
    description: "This action cannot be undone.",
    fields: [] as ProjectFieldName[],
    submit: { label: "Delete", pending: "Deleting..." },
  },
} satisfies Record<string, FormUIConfig<ProjectFieldName>>;
