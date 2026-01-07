import { FolderKanban, Home, Inbox, Settings } from "lucide-react";

export const NAV_MAIN = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Projects", url: "/dashboard/projects", icon: FolderKanban },
  { title: "Inbox", url: "/dashboard/inbox", icon: Inbox },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
] as const;
