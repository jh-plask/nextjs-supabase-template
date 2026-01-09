import type { Handler } from "../schema";

export const revoke: Handler = async ({ invitationId }, { supabase }) => {
  if (!invitationId) throw new Error("Invitation ID is required");

  const { error } = await supabase
    .from("organization_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  return { revoked: true };
};
