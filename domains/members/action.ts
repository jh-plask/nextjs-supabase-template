"use server";

import { createSafeAction } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import { handlers } from "./logic";
import { type Context, MemberSchema } from "./schema";

export const processMember = createSafeAction(MemberSchema, async (data) => {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Not authenticated");

  const { data: session } = await supabase.auth.getSession();
  const orgId = session.session?.access_token
    ? JSON.parse(atob(session.session.access_token.split(".")[1])).org_id
    : null;

  if (!orgId) throw new Error("No organization selected");

  const ctx: Context = { supabase, user: userData.user, orgId };

  return await handlers[data.operation](data, ctx);
});
