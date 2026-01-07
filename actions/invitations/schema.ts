import { z } from "zod";

// ============================================
// Invitation Schema
// ============================================

export const InvitationSchema = z.object({
  operation: z
    .enum(["create", "accept", "revoke"], {
      message: "Please select a valid operation",
    })
    .default("create"),

  // Email to invite (for create)
  email: z.string().email({ message: "Invalid email address" }).optional(),

  // Role for the invitation (for create)
  role: z.enum(["admin", "member", "viewer"]).default("member"),

  // Invitation token (for accept)
  token: z.string().uuid({ message: "Invalid invitation token" }).optional(),

  // Invitation ID (for revoke)
  invitationId: z
    .string()
    .uuid({ message: "Invalid invitation ID" })
    .optional(),
});

// ============================================
// Types
// ============================================

export type InvitationInput = z.infer<typeof InvitationSchema>;
export type Operation = InvitationInput["operation"];

// ============================================
// Domain Config Interface
// ============================================

export interface OperationConfig {
  handler: (data: InvitationInput) => Promise<unknown>;
  label: string;
  description: string;
  icon: string;
  confirmMessage?: string;
}

export type InvitationDomain = Record<Operation, OperationConfig>;
