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

  if (!data.token) {
    throw new Error("Invitation token is required");
  }

  // Use the database function to accept the invitation atomically
  const { data: result, error } = await supabase.rpc("accept_invitation", {
    invitation_token: data.token,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Refresh session to get new JWT claims with the new org
  await supabase.auth.refreshSession();

  return result;
}

export const accept: OperationConfig = {
  handler,
  label: "Accept Invitation",
  description: "Accept an invitation to join an organization",
  icon: "check-circle",
};
