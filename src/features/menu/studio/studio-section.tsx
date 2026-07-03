import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: ReactNode;
  description?: ReactNode;
  /** Optional header-right slot (e.g. an "Add" button or a size selector). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A titled card section — the standard container for a Menu Studio tab block.
 * Header (title + description + optional actions) over a padded body.
 */
export function StudioSection({ title, description, actions, children, className }: Props) {
  return (
    <section className={cn("rounded-xl border bg-card", className)}>
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
