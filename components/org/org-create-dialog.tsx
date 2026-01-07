"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { processOrg } from "@/actions/org";
import { orgFieldConfigs, orgFormConfigs } from "@/actions/org/form-config";
import { OrgSchema } from "@/actions/org/schema";
import { ConfigDrivenForm } from "@/components/ui/config-driven-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrgContext } from "@/lib/rbac";
import type { ActionState } from "@/lib/safe-action";
import { getZodDefaults } from "@/lib/safe-action";

const initialState = getZodDefaults(OrgSchema);

interface OrgCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrgCreateDialog({ open, onOpenChange }: OrgCreateDialogProps) {
  const router = useRouter();
  const { refreshClaims } = useOrgContext();

  const handleStateChange = useCallback(
    (state: ActionState<unknown>) => {
      if (state.status === "success") {
        onOpenChange(false);
        // Refresh JWT claims to get updated org_id from custom access token hook
        refreshClaims().then(() => {
          router.refresh();
        });
      }
    },
    [refreshClaims, router, onOpenChange]
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        <ConfigDrivenForm
          action={processOrg}
          className="flex flex-col gap-4"
          fieldConfigs={orgFieldConfigs}
          hiddenFields={{ operation: "create" }}
          initialState={initialState}
          onStateChange={handleStateChange}
          uiConfig={{
            ...orgFormConfigs.create,
            label: "", // Hide the legend since we have dialog title
            description: undefined,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
