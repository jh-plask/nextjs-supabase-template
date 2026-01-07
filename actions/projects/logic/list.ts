import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, ProjectInput } from "../schema";

async function handler(_data: ProjectInput) {
  const supabase = await createClient();

  // Get user's current org from JWT claims
  const session = await supabase.auth.getSession();
  const orgId = session.data.session?.access_token
    ? JSON.parse(atob(session.data.session.access_token.split(".")[1])).org_id
    : null;

  if (!orgId) {
    throw new Error("Please select an organization first");
  }

  // List projects (RLS filters by org_id from JWT claims)
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at, updated_at, created_by")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return { projects: projects ?? [] };
}

export const list: OperationConfig = {
  handler,
  label: "List Projects",
  description: "View all projects in this organization",
  icon: "list",
};
