import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      data-slot="skeleton"
      {...props}
    />
  );
}

// ============================================
// Preset Skeletons for Common Patterns
// ============================================

/** Card skeleton with header and content lines */
function CardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("space-y-3 rounded-lg border p-6", className)}
      data-slot="card-skeleton"
      {...props}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/** List item skeleton with avatar and text */
function ListItemSkeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg bg-muted/50 p-3",
        className
      )}
      data-slot="list-item-skeleton"
      {...props}
    >
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Form skeleton with fields and button */
function FormSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("space-y-4", className)}
      data-slot="form-skeleton"
      {...props}
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-28" />
    </div>
  );
}

/** Stats grid skeleton (3 cards) */
function StatsGridSkeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid gap-4 md:grid-cols-3", className)}
      data-slot="stats-grid-skeleton"
      {...props}
    >
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

/** Members/list section skeleton */
function ListSectionSkeleton({
  className,
  count = 3,
  ...props
}: React.ComponentProps<"div"> & { count?: number }) {
  return (
    <div
      className={cn("space-y-4 rounded-lg border p-6", className)}
      data-slot="list-section-skeleton"
      {...props}
    >
      <Skeleton className="h-5 w-32" />
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  FormSkeleton,
  StatsGridSkeleton,
  ListSectionSkeleton,
};
