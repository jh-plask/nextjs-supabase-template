import { createClient } from "@/lib/supabase/server";
import type { AuthInput } from "../schema";

export async function loginHandler(data: AuthInput) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email!,
    password: data.password!,
  });
  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
}
