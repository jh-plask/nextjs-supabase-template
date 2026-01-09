import { createDomain } from "@/lib/domain";
import { toSelectOptions } from "@/lib/utils/string";
import { processMember } from "./action";
import {
  type FieldName,
  fieldNames,
  MemberSchema,
  type Operation,
  operations,
  type Role,
  roles,
} from "./schema";

export const memberDomain = createDomain<
  FieldName,
  Operation,
  typeof MemberSchema
>({
  name: "member",
  action: processMember,
  schema: MemberSchema,

  fields: {
    email: {
      label: "Email",
      type: "email",
      placeholder: "user@example.com",
    },
    role: {
      label: "Role",
      type: "select",
      options: toSelectOptions(roles),
    },
  },

  operations: {
    add: {
      label: "Add Member",
      description: "Add a user directly to the organization.",
      icon: "user-plus",
      fields: ["email", "role"],
      submit: { label: "Add", pending: "Adding..." },
    },
    remove: {
      label: "Remove Member",
      description: "Remove a member from the organization.",
      icon: "user-minus",
      fields: [],
      submit: { label: "Remove", pending: "Removing..." },
    },
    "update-role": {
      label: "Update Role",
      description: "Change a member's role in the organization.",
      icon: "shield",
      fields: ["role"],
      submit: { label: "Update", pending: "Updating..." },
    },
  },
});

export { processMember };
export type { FieldName, Operation, Role };
export { fieldNames, operations, roles };
export type MemberDomain = typeof memberDomain;
