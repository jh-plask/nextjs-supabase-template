"use client";

import { processInvitation } from "@/actions/invitations";
import {
  invitationFieldConfigs,
  invitationFormConfigs,
} from "@/actions/invitations/form-config";
import { InvitationSchema } from "@/actions/invitations/schema";
import { ConfigDrivenDialog } from "@/components/ui/config-driven-dialog";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteMemberDialogProps) {
  return (
    <ConfigDrivenDialog
      action={processInvitation}
      description="Send an invitation to add a new member to your organization."
      fieldConfigs={invitationFieldConfigs}
      hiddenFields={{ operation: "create" }}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open={open}
      schema={InvitationSchema}
      testIdPrefix="invite"
      title="Invite Team Member"
      uiConfig={invitationFormConfigs.create}
    />
  );
}
