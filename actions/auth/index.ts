"use server";

import { redirect } from "next/navigation";
import { createSafeAction } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import { getHandler } from "./logic";
import { AuthSchema } from "./schema";

export const processAuth = createSafeAction(AuthSchema, async (data) => {
  const handler = getHandler(data.operation);
  const result = await handler(data);

  if (data.operation === "login") {
    redirect("/dashboard");
  }
  if (data.operation === "logout") {
    redirect("/auth?op=login");
  }

  return result;
});

// Simple logout action for direct form usage (doesn't use createSafeAction)
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth?op=login");
}
