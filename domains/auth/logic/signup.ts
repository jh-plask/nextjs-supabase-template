import { headers } from "next/headers";
import type { Handler } from "../schema";

export const signup: Handler = async ({ email, password }, supabase) => {
  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signUp({
    email: email!,
    password: password!,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) throw new Error(error.message);
  return { message: "Check your email to confirm your account" };
};
