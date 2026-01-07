"use client";

import { usePathname } from "next/navigation";
import { NAV_MAIN } from "@/lib/sidebar/constants";

export function PageHeader() {
  const pathname = usePathname();

  // Find matching nav item
  const currentNav = NAV_MAIN.find((item) => {
    if (item.url === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(item.url);
  });

  const title = currentNav?.title ?? "Dashboard";

  return <h1 className="font-medium text-sm">{title}</h1>;
}
