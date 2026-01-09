import type { Handler } from "../schema";

export const update: Handler = async (
  { orgId, name, slug, logoUrl },
  { supabase }
) => {
  if (!orgId) throw new Error("Organization ID is required");

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (slug) updateData.slug = slug;
  if (logoUrl !== undefined) updateData.logo_url = logoUrl;

  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .update(updateData)
    .eq("id", orgId)
    .select("id, name, slug")
    .single();

  if (error) throw new Error(error.message);

  return { orgId: org.id, name: org.name, slug: org.slug };
};
