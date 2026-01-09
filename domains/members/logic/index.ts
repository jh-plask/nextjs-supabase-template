import { add } from "./add";
import { remove } from "./remove";
import { updateRole } from "./update-role";

export const handlers = {
  add,
  remove,
  "update-role": updateRole,
} as const;
