import {
  HomeIcon,
  HomeSolidIcon,
  MembersIcon,
  MembersSolidIcon,
  ProjectsIcon,
  ProjectsSolidIcon,
  SettingsIcon,
  SettingsSolidIcon,
} from "@/components/icons";

export const NAV_MAIN = [
  {
    title: "Home",
    url: "/dashboard",
    icon: HomeIcon,
    solidIcon: HomeSolidIcon,
  },
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: ProjectsIcon,
    solidIcon: ProjectsSolidIcon,
  },
  {
    title: "Members",
    url: "/dashboard/org/members",
    icon: MembersIcon,
    solidIcon: MembersSolidIcon,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: SettingsIcon,
    solidIcon: SettingsSolidIcon,
  },
] as const;
