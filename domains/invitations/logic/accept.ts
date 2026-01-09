import { redirect } from "next/navigation";
import type { Handler } from "../schema";

export const accept: Handler = async ({ token }, { supabase }) => {
  if (!token) throw new Error("Invitation token is required");

  const { error } = await supabase.rpc("accept_invitation", {
    invitation_token: token,
  });

  if (error) throw new Error(error.message);

  // Refresh session to get new JWT claims
  await supabase.auth.refreshSession();

  redirect("/dashboard");
};
