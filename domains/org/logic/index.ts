import { create } from "./create";
import { deleteOrg } from "./delete";
import { switchOrg } from "./switch";
import { update } from "./update";

export const handlers = {
  create,
  update,
  switch: switchOrg,
  delete: deleteOrg,
} as const;
