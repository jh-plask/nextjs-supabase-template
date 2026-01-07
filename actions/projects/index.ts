"use server";

import { createSafeAction } from "@/lib/safe-action";
import { projectConfig } from "./logic";
import { ProjectSchema } from "./schema";

export const processProject = createSafeAction(ProjectSchema, async (data) => {
  return await projectConfig[data.operation].handler(data);
});
