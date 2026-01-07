"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useRightPanel } from "@/lib/sidebar/use-right-panel";

interface SidebarRightProps {
  children?: React.ReactNode;
}

export function SidebarRight({ children }: SidebarRightProps) {
  const { isOpen, closePanel } = useRightPanel();

  if (!isOpen) return null;

  return (
    <Sidebar className="border-l" collapsible="none" side="right">
      <SidebarHeader className="flex-row items-center justify-between border-b">
        <span className="font-medium">Details</span>
        <Button onClick={closePanel} size="icon-sm" variant="ghost">
          <X className="size-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
    </Sidebar>
  );
}
