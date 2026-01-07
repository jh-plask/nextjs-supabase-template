import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AuthInput } from "../schema";

export async function magicLinkHandler(data: AuthInput) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signInWithOtp({
    email: data.email!,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    throw new Error(error.message);
  }
  return { message: "Check your email for the magic link" };
}
