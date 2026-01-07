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

  if (!data.userId) {
    throw new Error("User ID is required");
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

  // Add member (RLS will enforce permissions)
  const { data: member, error } = await supabase
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: data.userId,
      role: data.role || "member",
    })
    .select("id, role, user_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("User is already a member of this organization");
    }
    throw new Error(error.message);
  }

  return { memberId: member.id, role: member.role };
}

export const add: OperationConfig = {
  handler,
  label: "Add Member",
  description: "Add a user directly to the organization",
  icon: "user-plus",
};
