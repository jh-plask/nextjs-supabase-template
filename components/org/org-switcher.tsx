"use client";

import { ChevronDown, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { processOrg } from "@/actions/org";
import { OrgSchema } from "@/actions/org/schema";
import { OrgCreateDialog } from "@/components/org/org-create-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { useOrgContext } from "@/lib/rbac";
import { getZodDefaults } from "@/lib/safe-action";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrgSwitcherProps {
  organizations: Organization[];
}

const initialState = getZodDefaults(OrgSchema);

export function OrgSwitcher({ organizations }: OrgSwitcherProps) {
  const router = useRouter();
  const { orgId, orgRole, refreshClaims } = useOrgContext();
  const [state, action] = useActionState(processOrg, initialState);
  const [isPending, startTransition] = useTransition();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [switchingToOrg, setSwitchingToOrg] = useState<Organization | null>(
    null
  );
  const prevStateRef = useRef(state);

  // Derive current org from props + context (no fetch needed)
  const currentOrg = useMemo(
    () => organizations.find((org) => org.id === orgId) ?? null,
    [organizations, orgId]
  );

  // Display name: show target org during switch, otherwise current org
  const displayName = switchingToOrg?.name ?? currentOrg?.name ?? "Select Org";
  const isLoading = isPending || switchingToOrg !== null;

  // Refresh claims and page after successful switch
  // Use ref comparison to detect new success states (fixes A->B->A issue)
  useEffect(() => {
    if (state.status === "success" && state !== prevStateRef.current) {
      prevStateRef.current = state;
      // Refresh JWT claims to get updated org_id from custom access token hook
      refreshClaims().then(() => {
        // Revalidate server components to show new org data
        router.refresh();
        // Clear switching state after refresh completes
        setSwitchingToOrg(null);
      });
    }
  }, [state, refreshClaims, router]);

  return (
    <DropdownMenu onOpenChange={setDropdownOpen} open={dropdownOpen}>
      <DropdownMenuTrigger
        className="inline-flex h-8 w-48 items-center justify-between gap-1.5 whitespace-nowrap rounded-lg border border-border bg-background px-2.5 font-medium text-sm transition-all hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        data-testid="org-switcher-trigger"
        disabled={isLoading}
      >
        <span className="truncate">{displayName}</span>
        {isLoading ? (
          <Spinner className="ml-2 shrink-0" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {organizations.map((org) => (
          <DropdownMenuItem
            className={org.id === orgId ? "bg-accent" : ""}
            data-testid={`org-item-${org.slug}`}
            disabled={isLoading}
            key={org.id}
            onClick={() => {
              if (org.id !== orgId) {
                setDropdownOpen(false);
                setSwitchingToOrg(org);
                startTransition(() => {
                  const formData = new FormData();
                  formData.append("operation", "switch");
                  formData.append("orgId", org.id);
                  action(formData);
                });
              }
            }}
          >
            <span className="truncate">{org.name}</span>
            {org.id === orgId && (
              <span className="ml-auto text-muted-foreground text-xs">
                {orgRole}
              </span>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          data-testid="org-new-link"
          onClick={() => {
            setDropdownOpen(false);
            setCreateDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </DropdownMenuItem>

        {currentOrg && (orgRole === "owner" || orgRole === "admin") && (
          <DropdownMenuItem data-testid="org-settings-link">
            <Link className="flex items-center" href="/dashboard/org/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>

      <OrgCreateDialog
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
      />
    </DropdownMenu>
  );
}
