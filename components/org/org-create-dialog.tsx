"use client";

import { useCallback } from "react";
import { processOrg } from "@/actions/org";
import { orgFieldConfigs, orgFormConfigs } from "@/actions/org/config";
import { OrgSchema } from "@/actions/org/schema";
import { ConfigDrivenDialog } from "@/components/ui/config-driven-dialog";
import { useOrgContext } from "@/lib/rbac";

interface OrgCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrgCreateDialog({ open, onOpenChange }: OrgCreateDialogProps) {
  const { refreshClaims } = useOrgContext();

  // Refresh JWT claims to get updated org_id from custom access token hook
  const handleSuccess = useCallback(async () => {
    await refreshClaims();
  }, [refreshClaims]);

  return (
    <ConfigDrivenDialog
      action={processOrg}
      description="Create a new organization to collaborate with your team."
      fieldConfigs={orgFieldConfigs}
      hiddenFields={{ operation: "create" }}
      onOpenChange={onOpenChange}
      onSuccess={handleSuccess}
      open={open}
      schema={OrgSchema}
      testIdPrefix="org"
      title="Create Organization"
      uiConfig={orgFormConfigs.create}
    />
  );
}
