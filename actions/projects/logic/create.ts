import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, ProjectInput } from "../schema";

async function handler(data: ProjectInput) {
  const supabase = await createClient();

  if (!data.name) {
    throw new Error("Project name is required");
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get user's current org from JWT claims
  const session = await supabase.auth.getSession();
  const orgId = session.data.session?.access_token
    ? JSON.parse(atob(session.data.session.access_token.split(".")[1])).org_id
    : null;

  if (!orgId) {
    throw new Error("Please select an organization first");
  }

  // Create project (RLS will verify permission)
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: orgId,
      name: data.name,
      description: data.description ?? null,
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

  // Revalidate the projects page to show the new project
  revalidatePath("/dashboard/projects");

  return project;
}

export const create: OperationConfig = {
  handler,
  label: "Create Project",
  description: "Create a new project in this organization",
  icon: "plus-circle",
};
