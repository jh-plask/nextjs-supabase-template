import { createDomain } from "@/lib/domain";
import { processOrg } from "./action";
import {
  type FieldName,
  fieldNames,
  type Operation,
  OrgSchema,
  operations,
} from "./schema";

export const orgDomain = createDomain<FieldName, Operation, typeof OrgSchema>({
  name: "org",
  action: processOrg,
  schema: OrgSchema,

  fields: {
    name: {
      label: "Organization Name",
      type: "text",
      placeholder: "Acme Inc.",
    },
    slug: {
      label: "Slug",
      type: "text",
      placeholder: "acme-inc",
      description: "URL-friendly identifier. Auto-generated if not provided.",
    },
  },

  operations: {
    create: {
      label: "Create Organization",
      description: "Create a new organization to collaborate with your team.",
      icon: "plus-circle",
      fields: ["name", "slug"],
      submit: { label: "Create Organization", pending: "Creating..." },
    },
    update: {
      label: "Organization Settings",
      description: "Update your organization details.",
      icon: "settings",
      fields: ["name", "slug"],
      submit: { label: "Save Changes", pending: "Saving..." },
    },
    switch: {
      label: "Switch Organization",
      description: "Switch to a different organization.",
      icon: "arrow-right-left",
      fields: [],
      submit: { label: "Switch", pending: "Switching..." },
    },
    delete: {
      label: "Delete Organization",
      description: "Permanently delete this organization and all its data.",
      icon: "trash-2",
      fields: [],
      submit: { label: "Delete", pending: "Deleting..." },
    },
  },
});

export { processOrg };
export type { FieldName, Operation };
export { fieldNames, operations };
export type OrgDomain = typeof orgDomain;
