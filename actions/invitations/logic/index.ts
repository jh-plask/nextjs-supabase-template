import type { InvitationDomain } from "../schema";
import { accept } from "./accept";
import { create } from "./create";
import { revoke } from "./revoke";

export const invitationConfig: InvitationDomain = {
  create,
  accept,
  revoke,
};
