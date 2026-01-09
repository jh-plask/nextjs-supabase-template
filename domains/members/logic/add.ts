import type { Handler } from "../schema";

export const add: Handler = async ({ userId, role }, { supabase, orgId }) => {
  if (!userId) throw new Error("User ID is required");

  const { data, error } = await supabase
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: userId,
      role: role || "member",
    })
    .select("id, role, user_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("User is already a member of this organization");
    }
    throw new Error(error.message);
  }

  return { memberId: data.id, role: data.role };
};
