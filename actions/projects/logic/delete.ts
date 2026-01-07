import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, ProjectInput } from "../schema";

async function handler(data: ProjectInput) {
  const supabase = await createClient();

  if (!data.projectId) {
    throw new Error("Project ID is required");
  }

  // Delete project (RLS will verify permission)
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", data.projectId);

  if (error) {
    if (error.code === "42501") {
      throw new Error("You don't have permission to delete this project");
    }
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/projects");

  return { deleted: true };
}

export const deleteProject: OperationConfig = {
  handler,
  label: "Delete Project",
  description: "Permanently delete this project",
  icon: "trash",
  confirmMessage: "Are you sure you want to delete this project?",
};
