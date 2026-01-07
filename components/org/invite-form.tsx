"use client";

import { processInvitation } from "@/actions/invitations";
import {
  invitationFieldConfigs,
  invitationFormConfigs,
} from "@/actions/invitations/form-config";
import { InvitationSchema } from "@/actions/invitations/schema";
import { ConfigDrivenForm } from "@/components/ui/config-driven-form";
import type { ActionState } from "@/lib/safe-action";
import { getZodDefaults } from "@/lib/safe-action";

const initialState = getZodDefaults(InvitationSchema);

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
      action={processInvitation}
      fieldConfigs={invitationFieldConfigs}
      hiddenFields={{ operation: "create" }}
      initialState={initialState}
      onStateChange={handleStateChange}
      uiConfig={invitationFormConfigs.create}
    />
  );
}
