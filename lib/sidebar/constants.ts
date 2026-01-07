import { FolderKanban, Home, Settings, Users } from "lucide-react";

export const NAV_MAIN = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Projects", url: "/dashboard/projects", icon: FolderKanban },
  { title: "Members", url: "/dashboard/org/members", icon: Users },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
] as const;
