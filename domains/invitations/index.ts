import { createDomain } from "@/lib/domain";
import { toSelectOptions } from "@/lib/utils/string";
import { processInvitation } from "./action";
import {
  type FieldName,
  fieldNames,
  InvitationSchema,
  type Operation,
  operations,
  type Role,
  roles,
} from "./schema";

export const invitationDomain = createDomain<
  FieldName,
  Operation,
  typeof InvitationSchema
>({
  name: "invitation",
  action: processInvitation,
  schema: InvitationSchema,

  fields: {
    email: {
      label: "Email",
      type: "email",
      placeholder: "colleague@example.com",
    },
    role: {
      label: "Role",
      type: "select",
      options: toSelectOptions(roles),
    },
  },

  operations: {
    create: {
      label: "Invite Member",
      description: "Send an invitation to join your organization.",
      icon: "mail-plus",
      fields: ["email", "role"],
      submit: { label: "Send Invite", pending: "Sending..." },
    },
    accept: {
      label: "Accept Invitation",
      description: "Accept an invitation to join an organization.",
      icon: "check-circle",
      fields: [],
      submit: { label: "Accept", pending: "Accepting..." },
    },
    revoke: {
      label: "Revoke Invitation",
      description: "Cancel a pending invitation.",
      icon: "x-circle",
      fields: [],
      submit: { label: "Revoke", pending: "Revoking..." },
    },
  },
});

export { processInvitation };
export type { FieldName, Operation, Role };
export { fieldNames, operations, roles };
export type InvitationDomain = typeof invitationDomain;
