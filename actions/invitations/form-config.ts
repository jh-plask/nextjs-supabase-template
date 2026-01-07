import type { FieldConfig, FormUIConfig } from "@/lib/form-config";
import { toSelectOptions } from "@/lib/utils/string";

// ============================================
// Field Names Type
// ============================================

export type InvitationFieldName = "email" | "role";

// ============================================
// Role Values
// ============================================

const ROLES = ["admin", "member", "viewer"] as const;

// ============================================
// Field Configs
// ============================================

export const invitationFieldConfigs: Record<InvitationFieldName, FieldConfig> =
  {
    email: {
      label: "Email",
      type: "email",
      placeholder: "colleague@example.com",
    },
    role: {
      label: "Role",
      type: "select",
      options: toSelectOptions(ROLES),
    },
  };

// ============================================
// Form UI Configs
// ============================================

export const invitationFormConfigs = {
  create: {
    label: "Invite Member",
    description: "Send an invitation to join your organization.",
    fields: ["email", "role"] as InvitationFieldName[],
    submit: { label: "Send Invite", pending: "Sending..." },
  },
  revoke: {
    label: "Revoke Invitation",
    description: "Cancel a pending invitation.",
    fields: [] as InvitationFieldName[],
    submit: { label: "Revoke", pending: "Revoking..." },
  },
} satisfies Record<string, FormUIConfig<InvitationFieldName>>;
