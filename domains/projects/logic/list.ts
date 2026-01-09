import type { Handler } from "../schema";

export const list: Handler = async (_data, { supabase }) => {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at, updated_at, created_by")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return { projects: projects ?? [] };
};
