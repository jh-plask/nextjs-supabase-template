import type { Handler } from "../schema";

export const logout: Handler = async (_data, supabase) => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  return { success: true };
};
