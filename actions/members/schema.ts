import { z } from "zod";

// ============================================
// Member Schema
// ============================================

export const MemberSchema = z.object({
  operation: z
    .enum(["add", "remove", "update-role"], {
      message: "Please select a valid operation",
    })
    .default("add"),

  // Member's user ID (required for remove, update-role)
  memberId: z.string().uuid({ message: "Invalid member ID" }).optional(),

  // User ID to add (for add operation)
  userId: z.string().uuid({ message: "Invalid user ID" }).optional(),

  // Email for inviting new members
  email: z.string().email({ message: "Invalid email address" }).optional(),

  // Role assignment
  role: z.enum(["admin", "member", "viewer"]).optional(),
});

// ============================================
// Types
// ============================================

export type MemberInput = z.infer<typeof MemberSchema>;
export type Operation = MemberInput["operation"];

// ============================================
// Domain Config Interface
// ============================================

export interface OperationConfig {
  handler: (data: MemberInput) => Promise<unknown>;
  label: string;
  description: string;
  icon: string;
  confirmMessage?: string;
}

export type MemberDomain = Record<Operation, OperationConfig>;
