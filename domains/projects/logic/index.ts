import { create } from "./create";
import { deleteProject } from "./delete";
import { list } from "./list";
import { update } from "./update";

export const handlers = {
  create,
  list,
  update,
  delete: deleteProject,
} as const;
