import type { FieldConfig, FormUIConfig } from "@/lib/form-config";

// ============================================
// Field Names Type
// ============================================

export type OrgFieldName = "name" | "slug";

// ============================================
// Field Configs
// ============================================

export const orgFieldConfigs: Record<OrgFieldName, FieldConfig> = {
  name: {
    label: "Organization Name",
    type: "text",
    placeholder: "Acme Inc.",
  },
  slug: {
    label: "Slug (optional)",
    type: "text",
    placeholder: "acme-inc",
    description: "URL-friendly identifier. Auto-generated if not provided.",
  },
};

// ============================================
// Form UI Configs
// ============================================

export const orgFormConfigs = {
  create: {
    label: "Create Organization",
    description: "Create a new organization to collaborate with your team.",
    fields: ["name", "slug"] as OrgFieldName[],
    submit: { label: "Create Organization", pending: "Creating..." },
  },
  update: {
    label: "Organization Settings",
    description: "Update your organization details.",
    fields: ["name", "slug"] as OrgFieldName[],
    submit: { label: "Save Changes", pending: "Saving..." },
  },
} satisfies Record<string, FormUIConfig<OrgFieldName>>;
