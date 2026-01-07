import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?op=login");
  }

  // Fetch projects - RLS filters by user's current org from JWT claims
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, created_at, updated_at")
    .order("created_at", { ascending: false });

  return <ProjectsClient initialProjects={projects ?? []} />;
}
