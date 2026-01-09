"use client";

import { ConfigDrivenForm } from "@/components/ui/config-driven-form";
import { invitationDomain } from "@/domains/invitations";
import type { ActionState } from "@/lib/safe-action";

interface InviteFormProps {
  onSuccess?: () => void;
}

export function InviteForm({ onSuccess }: InviteFormProps) {
  const handleStateChange = (state: ActionState<unknown>) => {
    if (state.status === "success") {
      onSuccess?.();
    }
  };

  return (
    <ConfigDrivenForm
      action={invitationDomain.action}
      fields={invitationDomain.fields}
      hiddenFields={{ operation: "create" }}
      initialState={invitationDomain.getInitialState()}
      onStateChange={handleStateChange}
      uiConfig={invitationDomain.getFormConfig("create")}
    />
  );
}
