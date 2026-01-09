"use client";

import {
  ChevronsUpDownIcon,
  Icon,
  LogoutIcon,
  ProfileIcon,
  SettingsIcon,
} from "@/components/icons";
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
import { logoutAction } from "@/domains/auth";

interface NavUserProps {
  user: { email: string; avatar_url?: string };
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full"
            data-testid="user-menu-trigger"
            render={
              <SidebarMenuButton
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                size="lg"
              />
            }
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted font-medium text-sm">
              {user.email[0].toUpperCase()}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.email}</span>
            </div>
            <Icon className="ml-auto" icon={ChevronsUpDownIcon} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="truncate font-medium text-sm">{user.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon className="mr-2" icon={ProfileIcon} />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon className="mr-2" icon={SettingsIcon} />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <button className="w-full" type="submit">
                <DropdownMenuItem>
                  <Icon className="mr-2" icon={LogoutIcon} />
                  Log out
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
