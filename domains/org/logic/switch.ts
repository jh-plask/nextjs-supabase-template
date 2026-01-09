import type { Handler } from "../schema";

export const switchOrg: Handler = async ({ orgId }, { supabase, user }) => {
  if (!orgId) throw new Error("Organization ID is required");

  // Verify user is a member of the target organization
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    throw new Error("You are not a member of this organization");
  }

  // Update current organization preference
  const { error: prefError } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    current_organization_id: orgId,
  });

  if (prefError) throw new Error(prefError.message);

  // Refresh session to get new JWT claims
  await supabase.auth.refreshSession();

  return { orgId, role: membership.role };
};
