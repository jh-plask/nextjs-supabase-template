import { createClient } from "@/lib/supabase/server";

export async function logoutHandler() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
}
