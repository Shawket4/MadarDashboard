import * as React from "react";
import { cn } from "@/shared/lib/cn";

interface PageShellProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * True when the page renders inside a parent shell (e.g. the /menu tab
 * layout). Nested pages keep their PageShell call — padding, title and
 * description are suppressed so they don't double up; the action slot stays.
 */
export const NestedPageShellContext = React.createContext(false);

export function PageShell({ title, description, action, children, className }: PageShellProps) {
  const nested = React.useContext(NestedPageShellContext);

  if (nested) {
    return (
      <div className={cn("space-y-5 animate-fade-in", className)}>
        {action && <div className="flex justify-end">{action}</div>}
        {children}
      </div>
    );
  }

  return (
    <div className={cn("p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}
