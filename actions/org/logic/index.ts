import type { OrgDomain } from "../schema";
import { create } from "./create";
import { deleteOrg } from "./delete";
import { switchOrg } from "./switch";
import { update } from "./update";

export const orgConfig: OrgDomain = {
  create,
  update,
  switch: switchOrg,
  delete: deleteOrg,
};
