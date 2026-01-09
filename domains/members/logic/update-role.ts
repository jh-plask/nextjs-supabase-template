import type { Handler } from "../schema";

export const updateRole: Handler = async ({ memberId, role }, { supabase }) => {
  if (!memberId) throw new Error("Member ID is required");
  if (!role) throw new Error("Role is required");

  const { data, error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .select("id, role")
    .single();

  if (error) throw new Error(error.message);

  return { memberId: data.id, role: data.role };
};
