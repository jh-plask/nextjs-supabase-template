"use server";

import { createSafeAction } from "@/lib/safe-action";
import { memberConfig } from "./logic";
import { MemberSchema } from "./schema";

export const processMember = createSafeAction(MemberSchema, async (data) => {
  return await memberConfig[data.operation].handler(data);
});
