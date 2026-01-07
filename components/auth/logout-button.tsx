"use client";

import { useActionState } from "react";
import { processAuth } from "@/actions/auth";
import { authUIConfig } from "@/actions/auth/config";
import { AuthSchema } from "@/actions/auth/schema";
import { Button } from "@/components/ui/button";
import { getZodDefaults } from "@/lib/safe-action";

const initialState = getZodDefaults(AuthSchema);
const { submit } = authUIConfig.logout;

export function LogoutButton() {
  const [, action, isPending] = useActionState(processAuth, initialState);

  return (
    <form action={action}>
      <input name="operation" type="hidden" value="logout" />
      <Button
        data-testid="auth-logout-button"
        disabled={isPending}
        type="submit"
        variant="ghost"
      >
        {isPending ? submit.pending : submit.label}
      </Button>
    </form>
  );
}
