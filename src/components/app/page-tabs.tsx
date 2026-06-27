import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Scrollable page-level tab list — for multi-tab feature pages with many tabs.
 * Wraps Radix TabsPrimitive.List in an overflow-x-auto container; the inner
 * list stretches to at least full width so short lists don't float left.
 * Hides the scrollbar via the `no-scrollbar` utility.
 */
export function PageTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <div className={cn("w-full overflow-x-auto no-scrollbar", className)}>
      <TabsPrimitive.List
        className="flex min-w-full border-b border-border bg-transparent p-0 h-auto"
        {...props}
      />
    </div>
  );
}

/**
 * Page tab trigger — teal underline indicator, muted-to-foreground color
 * transition, generous touch target (h-10). Use inside PageTabsList.
 */
export function PageTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Layout + sizing — h-10 for touch-friendly target
        "relative inline-flex h-10 items-center gap-1.5 px-4",
        // Text
        "text-sm font-medium whitespace-nowrap text-muted-foreground",
        // Underline indicator via bottom border; -mb-px lets the 2px border
        // overlap (and visually replace) the list's 1px border-b track.
        "-mb-px border-b-2 border-transparent",
        // Transitions
        "transition-colors duration-150",
        // States
        "hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:rounded-sm",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:border-brand data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
