"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { processOrg } from "@/actions/org";
import { orgFieldConfigs, orgFormConfigs } from "@/actions/org/config";
import { OrgSchema } from "@/actions/org/schema";
import { ConfigDrivenForm } from "@/components/ui/config-driven-form";
import { useOrgContext } from "@/lib/rbac";
import type { ActionState } from "@/lib/safe-action";
import { getZodDefaults } from "@/lib/safe-action";

const initialState = getZodDefaults(OrgSchema);

export default function NewOrgPage() {
  const router = useRouter();
  const { refreshClaims } = useOrgContext();

  const handleStateChange = useCallback(
    (state: ActionState<unknown>) => {
      if (state.status === "success") {
        // Refresh JWT claims to get updated org_id from custom access token hook
        refreshClaims().then(() => {
          router.push("/dashboard");
          router.refresh();
        });
      }
    },
    [refreshClaims, router]
  );

  return (
    <ConfigDrivenForm
      action={processOrg}
      className="mx-auto max-w-md"
      fieldConfigs={orgFieldConfigs}
      hiddenFields={{ operation: "create" }}
      initialState={initialState}
      onStateChange={handleStateChange}
      uiConfig={orgFormConfigs.create}
    />
  );
}
