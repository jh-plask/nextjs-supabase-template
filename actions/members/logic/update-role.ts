import { createClient } from "@/lib/supabase/server";
import type { MemberInput, OperationConfig } from "../schema";

async function handler(data: MemberInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  if (!data.memberId) {
    throw new Error("Member ID is required");
  }

  if (!data.role) {
    throw new Error("Role is required");
  }

  // Update member role (RLS will enforce permissions)
  const { data: member, error } = await supabase
    .from("organization_members")
    .update({ role: data.role })
    .eq("id", data.memberId)
    .select("id, role")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { memberId: member.id, role: member.role };
}

export const updateRole: OperationConfig = {
  handler,
  label: "Update Role",
  description: "Change a member's role in the organization",
  icon: "shield",
};
