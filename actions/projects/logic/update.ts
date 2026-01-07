import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, ProjectInput } from "../schema";

async function handler(data: ProjectInput) {
  const supabase = await createClient();

  if (!data.projectId) {
    throw new Error("Project ID is required");
  }

  if (!data.name) {
    throw new Error("Project name is required");
  }

  // Update project (RLS will verify permission)
  const { data: project, error } = await supabase
    .from("projects")
    .update({
      name: data.name,
      description: data.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.projectId)
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
}

export const update: OperationConfig = {
  handler,
  label: "Update Project",
  description: "Update project details",
  icon: "edit",
};
