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

  // Verify user is a member of the target organization
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", data.orgId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    throw new Error("You are not a member of this organization");
  }

  // Update current organization preference
  const { error: prefError } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    current_organization_id: data.orgId,
  });

  if (prefError) {
    throw new Error(prefError.message);
  }

  // Refresh session to get new JWT claims
  await supabase.auth.refreshSession();

  return { orgId: data.orgId, role: membership.role };
}

export const switchOrg: OperationConfig = {
  handler,
  label: "Switch Organization",
  description: "Switch to a different organization",
  icon: "arrow-right-left",
};
