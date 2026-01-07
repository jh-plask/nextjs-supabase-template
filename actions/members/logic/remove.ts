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

  // Remove member (RLS will enforce permissions)
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", data.memberId);

  if (error) {
    throw new Error(error.message);
  }

  return { removed: true };
}

export const remove: OperationConfig = {
  handler,
  label: "Remove Member",
  description: "Remove a member from the organization",
  icon: "user-minus",
  confirmMessage: "Are you sure you want to remove this member?",
};
