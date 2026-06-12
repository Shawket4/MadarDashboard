import { Skeleton } from "./skeleton";
import { cn } from "@/shared/lib/cn";

/** Uniform loading placeholder for lists and tables. */
export function SkeletonList({
  count = 5,
  height = "h-14",
  className,
}: {
  count?: number;
  height?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn(height, "rounded-lg")} />
      ))}
    </div>
  );
}
