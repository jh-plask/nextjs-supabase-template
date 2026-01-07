import type { ProjectDomain } from "../schema";
import { create } from "./create";
import { deleteProject } from "./delete";
import { list } from "./list";
import { update } from "./update";

export const projectConfig: ProjectDomain = {
  create,
  list,
  update,
  delete: deleteProject,
};
