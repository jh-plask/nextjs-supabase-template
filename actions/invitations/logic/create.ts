import { requireOrgContext } from "@/lib/supabase/claims";
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

  if (!data.email) {
    throw new Error("Email is required");
  }

  // Get org context with defensive refresh (handles JWT sync timing issues)
  const { org_id: orgId } = await requireOrgContext(supabase);

  // Note: We don't check if invitee is already a member here because:
  // 1. We'd need admin API to look up user by email
  // 2. The accept flow will verify membership status
  // 3. Duplicate invitations are caught by DB unique constraint (error 23505)

  // Create invitation (RLS will enforce permissions)
  const { data: invitation, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: orgId,
      email: data.email.toLowerCase(),
      role: data.role || "member",
      invited_by: user.id,
    })
    .select("id, email, role, token, expires_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("An invitation has already been sent to this email");
    }
    throw new Error(error.message);
  }

  return {
    invitationId: invitation.id,
    email: invitation.email,
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expires_at,
  };
}

export const create: OperationConfig = {
  handler,
  label: "Send Invitation",
  description: "Invite someone to join the organization via email",
  icon: "mail-plus",
};
