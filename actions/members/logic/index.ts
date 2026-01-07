import type { MemberDomain } from "../schema";
import { add } from "./add";
import { remove } from "./remove";
import { updateRole } from "./update-role";

export const memberConfig: MemberDomain = {
  add,
  remove,
  "update-role": updateRole,
};
