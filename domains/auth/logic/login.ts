import type { Handler } from "../schema";

export const login: Handler = async ({ email, password }, supabase) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email!,
    password: password!,
  });
  if (error) throw new Error(error.message);
  return { success: true };
};
