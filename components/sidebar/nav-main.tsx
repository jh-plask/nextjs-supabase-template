"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NAV_MAIN } from "@/lib/sidebar/constants";

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {NAV_MAIN.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={item.url.endsWith(pathname)}
              render={<Link href={item.url} />}
              tooltip={item.title}
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
