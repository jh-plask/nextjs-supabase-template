"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { processInvitation } from "@/actions/invitations";
import {
  invitationFieldConfigs,
  invitationFormConfigs,
} from "@/actions/invitations/form-config";
import { InvitationSchema } from "@/actions/invitations/schema";
import { ConfigDrivenForm } from "@/components/ui/config-driven-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ActionState } from "@/lib/safe-action";
import { getZodDefaults } from "@/lib/safe-action";

const initialState = getZodDefaults(InvitationSchema);

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const router = useRouter();

  const handleStateChange = useCallback(
    (state: ActionState<unknown>) => {
      if (state.status === "success") {
        onOpenChange(false);
        router.refresh();
      }
    },
    [router, onOpenChange]
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to add a new member to your organization.
          </DialogDescription>
        </DialogHeader>
        <ConfigDrivenForm
          action={processInvitation}
          className="flex flex-col gap-4"
          fieldConfigs={invitationFieldConfigs}
          hiddenFields={{ operation: "create" }}
          initialState={initialState}
          onStateChange={handleStateChange}
          uiConfig={{
            ...invitationFormConfigs.create,
            label: "", // Hide the legend since we have dialog title
            description: undefined,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
