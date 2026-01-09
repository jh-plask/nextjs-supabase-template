import { revalidatePath } from "next/cache";
import type { Handler } from "../schema";

export const create: Handler = async (
  { name, description },
  { supabase, user, orgId }
) => {
  if (!name) throw new Error("Project name is required");

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: orgId,
      name,
      description: description ?? null,
      created_by: user.id,
    })
    .select("id, name, description")
    .single();

  if (error) {
    if (error.code === "42501") {
      throw new Error("You don't have permission to create projects");
    }
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/projects");

  return project;
};
