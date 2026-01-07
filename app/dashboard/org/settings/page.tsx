"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { processOrg } from "@/actions/org";
import { OrgSchema } from "@/actions/org/schema";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RequirePermission, useOrgContext } from "@/lib/rbac";
import { getZodDefaults } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

const initialState = getZodDefaults(OrgSchema);

function OrgSettingsForm() {
  const router = useRouter();
  const { orgId, refreshClaims } = useOrgContext();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [state, action, isPending] = useActionState(processOrg, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(
    processOrg,
    initialState
  );

  useEffect(() => {
    async function fetchOrg() {
      if (!orgId) {
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url")
        .eq("id", orgId)
        .single();

      if (data) {
        setOrg(data);
      }
      setIsLoading(false);
    }

    fetchOrg();
  }, [orgId]);

  useEffect(() => {
    if (state.status === "success") {
      refreshClaims();
    }
  }, [state.status, refreshClaims]);

  useEffect(() => {
    if (deleteState.status === "success") {
      router.push("/dashboard");
      router.refresh();
    }
  }, [deleteState.status, router]);

  if (isLoading || !org) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Update Form */}
      <form action={action} className="space-y-6">
        <input name="operation" type="hidden" value="update" />
        <input name="orgId" type="hidden" value={org.id} />

        <FieldSet>
          <FieldLegend>Organization Settings</FieldLegend>

          {state.status === "error" &&
            !Object.keys(state.errors || {}).length && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
                {state.message}
              </div>
            )}

          {state.status === "success" && (
            <div className="rounded border border-green-200 bg-green-50 p-3 text-green-600 text-sm">
              Settings updated successfully
            </div>
          )}

          <FieldGroup>
            <Field data-invalid={!!state.errors?.name}>
              <FieldLabel htmlFor="name">Organization Name</FieldLabel>
              <Input
                aria-invalid={!!state.errors?.name}
                defaultValue={org.name}
                id="name"
                name="name"
              />
              <FieldError>{state.errors?.name?.[0]}</FieldError>
            </Field>

            <Field data-invalid={!!state.errors?.slug}>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input
                aria-invalid={!!state.errors?.slug}
                defaultValue={org.slug}
                id="slug"
                name="slug"
              />
              <FieldError>{state.errors?.slug?.[0]}</FieldError>
            </Field>
          </FieldGroup>

          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </FieldSet>
      </form>

      {/* Members Link */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-2 font-semibold">Team Members</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Manage who has access to this organization.
        </p>
        <Link
          className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-background px-2.5 font-medium text-sm transition-all hover:bg-muted hover:text-foreground"
          href="/dashboard/org/members"
        >
          Manage Members
        </Link>
      </div>

      {/* Danger Zone */}
      <RequirePermission permission="org.delete">
        <div className="rounded-lg border border-red-200 p-6">
          <h3 className="mb-2 font-semibold text-red-600">Danger Zone</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            Once you delete an organization, there is no going back. Please be
            certain.
          </p>
          <form action={deleteAction}>
            <input name="operation" type="hidden" value="delete" />
            <input name="orgId" type="hidden" value={org.id} />
            <Button
              disabled={isDeleting}
              onClick={(e) => {
                if (
                  !confirm(
                    "Are you sure you want to delete this organization? This cannot be undone."
                  )
                ) {
                  e.preventDefault();
                }
              }}
              type="submit"
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete Organization"}
            </Button>
          </form>
          {deleteState.status === "error" && (
            <p className="mt-2 text-red-600 text-sm">{deleteState.message}</p>
          )}
        </div>
      </RequirePermission>
    </div>
  );
}

export default function OrgSettingsPage() {
  return (
    <RequirePermission
      fallback={
        <div className="text-center">
          <h2 className="font-semibold text-lg">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access organization settings.
          </p>
        </div>
      }
      permission="org.update"
    >
      <OrgSettingsForm />
    </RequirePermission>
  );
}
