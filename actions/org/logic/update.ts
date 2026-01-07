import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, OrgInput } from "../schema";

async function handler(data: OrgInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  if (!data.orgId) {
    throw new Error("Organization ID is required");
  }

  // Update organization (RLS will enforce permissions)
  const updateData: Record<string, unknown> = {};
  if (data.name) {
    updateData.name = data.name;
  }
  if (data.slug) {
    updateData.slug = data.slug;
  }
  if (data.logoUrl !== undefined) {
    updateData.logo_url = data.logoUrl;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .update(updateData)
    .eq("id", data.orgId)
    .select("id, name, slug")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { orgId: org.id, name: org.name, slug: org.slug };
}

export const update: OperationConfig = {
  handler,
  label: "Update Organization",
  description: "Update organization settings",
  icon: "settings",
};
