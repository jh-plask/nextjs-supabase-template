"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { authDomain } from "@/domains/auth";

const initialState = authDomain.getInitialState();
const { submit } = authDomain.operations.logout;

export function LogoutButton() {
  const [, action, isPending] = useActionState(authDomain.action, initialState);

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
