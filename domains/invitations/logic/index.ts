import { accept } from "./accept";
import { create } from "./create";
import { revoke } from "./revoke";

export const handlers = {
  create,
  accept,
  revoke,
} as const;
