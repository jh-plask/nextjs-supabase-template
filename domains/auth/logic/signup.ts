import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AuthInput } from "../schema";

export async function signupHandler(data: AuthInput) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signUp({
    email: data.email!,
    password: data.password!,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    throw new Error(error.message);
  }
  return { message: "Check your email to confirm your account" };
}
