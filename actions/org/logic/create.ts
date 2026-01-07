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

  // Refresh session to get new JWT claims with org info
  await supabase.auth.refreshSession();

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
