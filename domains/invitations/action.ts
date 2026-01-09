"use server";

import { createSafeAction } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import { handlers } from "./logic";
import { type Context, InvitationSchema } from "./schema";

export const processInvitation = createSafeAction(
  InvitationSchema,
  async (data) => {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { data: session } = await supabase.auth.getSession();
    const orgId = session.session?.access_token
      ? JSON.parse(atob(session.session.access_token.split(".")[1])).org_id
      : null;

    const ctx: Context = { supabase, user: userData.user, orgId };

    return await handlers[data.operation](data, ctx);
  }
);
