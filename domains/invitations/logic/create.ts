import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Handler } from "../schema";

export const create: Handler = async (
  { email, role },
  { supabase, user, orgId }
) => {
  if (!email) throw new Error("Email is required");
  if (!orgId) throw new Error("Please select an organization first");

  const emailLower = email.toLowerCase();

  // Get organization name for email
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const organizationName = org?.name || "Organization";

  // Check if user already exists
  const admin = createAdminClient();
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find(
    (u) => u.email?.toLowerCase() === emailLower
  );

  // Check if already a member
  if (existingUser) {
    const { data: existingMember } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", existingUser.id)
      .single();

    if (existingMember) {
      throw new Error("This user is already a member of the organization");
    }
  }

  // Create invitation record
  const { data: invitation, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: orgId,
      email: emailLower,
      role: role || "member",
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

  // Build redirect URL for after invite acceptance
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectTo = `${protocol}://${host}/auth/callback?type=invite&token=${invitation.token}`;
  const invitePageUrl = `${protocol}://${host}/auth/invite?token=${invitation.token}`;

  if (existingUser) {
    // User exists - send a magic link
    const { error: magicLinkError } = await admin.auth.signInWithOtp({
      email: emailLower,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: invitePageUrl,
        data: {
          invitation_token: invitation.token,
          invited_to_org: orgId,
          invited_org_name: organizationName,
        },
      },
    });

    if (magicLinkError) {
      console.error(
        `[invitation:create] Failed to send magic link to ${emailLower}:`,
        magicLinkError.message
      );
    }
  } else {
    // New user - use Supabase's invite system
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      emailLower,
      {
        redirectTo,
        data: {
          invitation_token: invitation.token,
          invited_to_org: orgId,
          invited_role: role || "member",
          invited_org_name: organizationName,
        },
      }
    );

    if (inviteError) {
      // Rollback the invitation record if email fails
      await supabase
        .from("organization_invitations")
        .delete()
        .eq("id", invitation.id);

      throw new Error(
        `Failed to send invitation email: ${inviteError.message}`
      );
    }
  }

  return {
    invitationId: invitation.id,
    email: invitation.email,
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expires_at,
  };
};
