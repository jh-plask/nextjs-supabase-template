"use client";

import { useCallback } from "react";
import { ConfigDrivenDialog } from "@/components/ui/config-driven-dialog";
import { orgDomain, processOrg } from "@/domains/org";
import { OrgSchema } from "@/domains/org/schema";
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
      description={orgDomain.operations.create.description}
      fields={orgDomain.fields}
      hiddenFields={{ operation: "create" }}
      onOpenChange={onOpenChange}
      onSuccess={handleSuccess}
      open={open}
      schema={OrgSchema}
      testIdPrefix="org"
      title={orgDomain.operations.create.label}
      uiConfig={orgDomain.getFormConfig("create")}
    />
  );
}
