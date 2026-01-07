"use server";

import { createSafeAction } from "@/lib/safe-action";
import { invitationConfig } from "./logic";
import { InvitationSchema } from "./schema";

export const processInvitation = createSafeAction(
  InvitationSchema,
  async (data) => {
    return await invitationConfig[data.operation].handler(data);
  }
);
