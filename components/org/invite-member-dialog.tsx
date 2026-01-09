"use client";

import { ConfigDrivenDialog } from "@/components/ui/config-driven-dialog";
import { invitationDomain, processInvitation } from "@/domains/invitations";
import { InvitationSchema } from "@/domains/invitations/schema";

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
      description={invitationDomain.operations.create.description}
      fields={invitationDomain.fields}
      hiddenFields={{ operation: "create" }}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open={open}
      schema={InvitationSchema}
      testIdPrefix="invite"
      title={invitationDomain.operations.create.label}
      uiConfig={invitationDomain.getFormConfig("create")}
    />
  );
}
