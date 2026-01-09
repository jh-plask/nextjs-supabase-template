import { revalidatePath } from "next/cache";
import type { Handler } from "../schema";

export const deleteProject: Handler = async ({ projectId }, { supabase }) => {
  if (!projectId) throw new Error("Project ID is required");

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    if (error.code === "42501") {
      throw new Error("You don't have permission to delete this project");
    }
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/projects");

  return { deleted: true };
};
