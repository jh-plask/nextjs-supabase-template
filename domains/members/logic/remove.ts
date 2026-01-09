import type { Handler } from "../schema";

export const remove: Handler = async ({ memberId }, { supabase }) => {
  if (!memberId) throw new Error("Member ID is required");

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) throw new Error(error.message);

  return { removed: true };
};
