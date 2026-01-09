import type { Handler } from "../schema";

export const deleteOrg: Handler = async ({ orgId }, { supabase, user }) => {
  if (!orgId) throw new Error("Organization ID is required");

  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", orgId);

  if (error) throw new Error(error.message);

  // Clear current org if it was the deleted one
  const { error: prefError } = await supabase
    .from("user_preferences")
    .update({ current_organization_id: null })
    .eq("user_id", user.id)
    .eq("current_organization_id", orgId);

  if (prefError) {
    console.error("Failed to clear org preference:", prefError);
  }

  // Refresh session to update JWT claims
  await supabase.auth.refreshSession();

  return { deleted: true };
};
