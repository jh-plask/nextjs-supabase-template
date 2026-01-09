"use server";

import { redirect } from "next/navigation";
import { createSafeAction } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import { handlers } from "./logic";
import { AuthSchema } from "./schema";

export const processAuth = createSafeAction(AuthSchema, async (data) => {
  // Shared context setup - auth operations don't require user
  const supabase = await createClient();

  const result = await handlers[data.operation](data, supabase);

  if (data.operation === "login") redirect("/dashboard");
  if (data.operation === "logout") redirect("/auth?op=login");

  return result;
});

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth?op=login");
}
