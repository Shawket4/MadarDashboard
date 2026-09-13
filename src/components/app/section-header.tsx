import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A section's label (POS SPEC §7): 13/600 sentence case, optional glyph and a
 * trailing slot (a count, a "See all", a small control). Never repeats the
 * page title. 12 above its content.
 */
export function SectionHeader({
  title,
  description,
  icon: Icon,
  count,
  trailing,
  as: Heading = "h2",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  count?: number;
  trailing?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <div data-slot="section-header" className={cn("flex min-h-8 items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <Heading className="flex items-center gap-2 text-base font-semibold tracking-[-0.005em]">
          {Icon ? <Icon aria-hidden className="size-4 text-muted-foreground" /> : null}
          <span className="truncate">{title}</span>
          {count !== undefined ? (
            <span className="rounded-full bg-secondary px-1.5 font-mono text-xs font-medium text-muted-foreground tabular-nums">
              {count}
            </span>
          ) : null}
        </Heading>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </div>
  );
}
