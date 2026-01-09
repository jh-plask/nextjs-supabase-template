"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AddIcon,
  ChevronsUpDownIcon,
  Icon,
  OrgIcon,
  SettingsIcon,
} from "@/components/icons";
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { orgDomain } from "@/domains/org";
import { useOrgContext } from "@/lib/rbac";
import { Skeleton } from "../ui/skeleton";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrgSwitcherProps {
  organizations: Organization[];
}

export function OrgSwitcher({ organizations }: OrgSwitcherProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { orgId, orgRole, refreshClaims } = useOrgContext();
  const [state, action] = useActionState(
    orgDomain.action,
    orgDomain.getInitialState()
  );
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
  const displayName = switchingToOrg?.name ?? currentOrg?.name;
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
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={setDropdownOpen} open={dropdownOpen}>
          <DropdownMenuTrigger
            className="w-full"
            data-testid="org-switcher-trigger"
            disabled={isLoading}
            render={
              <SidebarMenuButton
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                tooltip={displayName}
              />
            }
          >
            <div className="flex size-6.5 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {isLoading ? (
                <Spinner className="size-4" />
              ) : (
                <Icon icon={OrgIcon} />
              )}
            </div>
            {displayName ? (
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
              </div>
            ) : (
              <Skeleton className="h-4 w-24" />
            )}

            <Icon className="ml-auto" icon={ChevronsUpDownIcon} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Organizations
              </DropdownMenuLabel>

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
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Icon icon={OrgIcon} />
                  </div>
                  <span className="truncate">{org.name}</span>
                  {org.id === orgId && (
                    <span className="ml-auto text-muted-foreground text-xs">
                      {orgRole}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              data-testid="org-new-link"
              onClick={() => {
                setDropdownOpen(false);
                setCreateDialogOpen(true);
              }}
            >
              <Icon className="mr-2" icon={AddIcon} />
              New Organization
            </DropdownMenuItem>

            {currentOrg && (orgRole === "owner" || orgRole === "admin") && (
              <DropdownMenuItem
                data-testid="org-settings-link"
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/dashboard/org/settings");
                }}
              >
                <Icon className="mr-2" icon={SettingsIcon} />
                Settings
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <OrgCreateDialog
          onOpenChange={setCreateDialogOpen}
          open={createDialogOpen}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
