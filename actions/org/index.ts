"use server";

import { createSafeAction } from "@/lib/safe-action";
import { orgConfig } from "./logic";
import { OrgSchema } from "./schema";

export const processOrg = createSafeAction(OrgSchema, async (data) => {
  return await orgConfig[data.operation].handler(data);
});
