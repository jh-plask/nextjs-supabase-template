"use server";

import { redirect } from "next/navigation";
import { createSafeAction } from "@/lib/safe-action";
import { getHandler } from "./logic";
import { AuthSchema } from "./schema";

export const processAuth = createSafeAction(AuthSchema, async (data) => {
  const handler = getHandler(data.operation);
  const result = await handler(data);

  if (data.operation === "login") {
    redirect("/dashboard");
  }
  if (data.operation === "logout") {
    redirect("/auth?op=login");
  }

  return result;
});
