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

  // Get current org from JWT
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const orgId = session?.access_token
    ? JSON.parse(atob(session.access_token.split(".")[1])).org_id
    : null;

  if (!orgId) {
    throw new Error("No organization selected");
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    throw new Error("User is already a member of this organization");
  }

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
