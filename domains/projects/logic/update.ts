import { revalidatePath } from "next/cache";
import type { Handler } from "../schema";

export const update: Handler = async (
  { projectId, name, description },
  { supabase }
) => {
  if (!projectId) throw new Error("Project ID is required");
  if (!name) throw new Error("Project name is required");

  const { data: project, error } = await supabase
    .from("projects")
    .update({
      name,
      description: description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select("id, name, description")
    .single();

  if (error) {
    if (error.code === "42501") {
      throw new Error("You don't have permission to update this project");
    }
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/projects");

  return project;
};
