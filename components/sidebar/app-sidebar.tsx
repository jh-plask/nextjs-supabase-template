import { OrgSwitcher } from "@/components/org/org-switcher";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizations: Organization[];
  user: { email: string; avatar_url?: string };
}

export function AppSidebar({ organizations, user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher organizations={organizations} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
