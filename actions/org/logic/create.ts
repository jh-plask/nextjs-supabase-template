import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, OrgInput } from "../schema";

async function handler(data: OrgInput) {
  const supabase = await createClient();

  if (!data.name) {
    throw new Error("Organization name is required");
  }

  // Use security definer function to create org (bypasses RLS for bootstrap)
  const { data: result, error } = await supabase.rpc("create_organization", {
    p_name: data.name,
    p_slug: data.slug ?? null,
    p_logo_url: data.logoUrl ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Force session refresh to get new JWT claims with org_id and org_role
  // The custom access token hook will populate these from user_preferences
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    console.error("Session refresh failed:", refreshError);
  }

  // Revalidate dashboard routes to pick up new session
  revalidatePath("/dashboard", "layout");

  return {
    orgId: result.id,
    name: result.name,
    slug: result.slug,
  };
}

export const create: OperationConfig = {
  handler,
  label: "Create Organization",
  description: "Create a new organization workspace",
  icon: "plus-circle",
};
