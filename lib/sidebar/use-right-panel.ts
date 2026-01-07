"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useRightPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const panelId = searchParams.get("panel");

  const openPanel = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("panel", id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const closePanel = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("panel");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  return { panelId, openPanel, closePanel, isOpen: !!panelId };
}
