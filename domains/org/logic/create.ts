import { revalidatePath } from "next/cache";
import { toSlug } from "@/lib/utils";
import type { Handler } from "../schema";

export const create: Handler = async (
  { name, slug, logoUrl },
  { supabase }
) => {
  if (!name) throw new Error("Organization name is required");

  // Generate slug from name if not provided
  const finalSlug = slug?.trim() || toSlug(name);

  const { data: result, error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_slug: finalSlug,
    p_logo_url: logoUrl ?? undefined,
  });

  if (error) throw new Error(error.message);
  if (!result) throw new Error("Failed to create organization");

  const org = result as { id: string; name: string; slug: string };

  // Refresh session to get new JWT claims with org_id and org_role
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    console.error("Session refresh failed:", refreshError);
  }

  revalidatePath("/dashboard", "layout");

  return { orgId: org.id, name: org.name, slug: org.slug };
};
