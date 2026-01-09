import { headers } from "next/headers";
import type { Handler } from "../schema";

export const magicLink: Handler = async ({ email }, supabase) => {
  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signInWithOtp({
    email: email!,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) throw new Error(error.message);
  return { message: "Check your email for the magic link" };
};
