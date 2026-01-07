import { createClient } from "@/lib/supabase/server";
import type { InvitationInput, OperationConfig } from "../schema";

async function handler(data: InvitationInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  if (!data.invitationId) {
    throw new Error("Invitation ID is required");
  }

  // Revoke invitation (RLS will enforce permissions)
  const { error } = await supabase
    .from("organization_invitations")
    .update({ status: "revoked" })
    .eq("id", data.invitationId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  return { revoked: true };
}

export const revoke: OperationConfig = {
  handler,
  label: "Revoke Invitation",
  description: "Cancel a pending invitation",
  icon: "x-circle",
  confirmMessage: "Are you sure you want to revoke this invitation?",
};
