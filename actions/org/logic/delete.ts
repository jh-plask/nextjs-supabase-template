import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, OrgInput } from "../schema";

async function handler(data: OrgInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  if (!data.orgId) {
    throw new Error("Organization ID is required");
  }

  // Delete organization (RLS will enforce permissions)
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", data.orgId);

  if (error) {
    throw new Error(error.message);
  }

  // Clear current org if it was the deleted one
  const { error: prefError } = await supabase
    .from("user_preferences")
    .update({ current_organization_id: null })
    .eq("user_id", user.id)
    .eq("current_organization_id", data.orgId);

  if (prefError) {
    // Non-critical error, just log
    console.error("Failed to clear org preference:", prefError);
  }

  // Refresh session to update JWT claims
  await supabase.auth.refreshSession();

  return { deleted: true };
}

export const deleteOrg: OperationConfig = {
  handler,
  label: "Delete Organization",
  description: "Permanently delete this organization and all its data",
  icon: "trash-2",
  confirmMessage:
    "Are you sure you want to delete this organization? This action cannot be undone.",
};
