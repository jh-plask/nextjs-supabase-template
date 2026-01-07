"use client";

import { useEffect } from "react";
import { AlertIcon, Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Empty className="border py-16">
      <EmptyMedia variant="icon">
        <Icon icon={AlertIcon} />
      </EmptyMedia>
      <EmptyContent>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>Failed to load this section.</EmptyDescription>
        {error.digest && (
          <p className="font-mono text-muted-foreground text-xs">
            Error ID: {error.digest}
          </p>
        )}
      </EmptyContent>
      <Button onClick={reset}>Try again</Button>
    </Empty>
  );
}
