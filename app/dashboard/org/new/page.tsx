"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ConfigDrivenForm } from "@/components/ui/config-driven-form";
import { orgDomain } from "@/domains/org";
import { useOrgContext } from "@/lib/rbac";
import type { ActionState } from "@/lib/safe-action";

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
      action={orgDomain.action}
      className="mx-auto max-w-md"
      fields={orgDomain.fields}
      hiddenFields={{ operation: "create" }}
      initialState={orgDomain.getInitialState()}
      onStateChange={handleStateChange}
      uiConfig={orgDomain.getFormConfig("create")}
    />
  );
}
