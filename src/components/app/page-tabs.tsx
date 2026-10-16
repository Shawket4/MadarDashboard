import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { useIndicator } from "@/lib/motion";

/**
 * Scrollable page-level tab list — for multi-tab feature pages with many tabs.
 * Wraps Radix TabsPrimitive.List in an overflow-x-auto container; the inner
 * list stretches to at least full width so short lists don't float left.
 * Hides the scrollbar via the `no-scrollbar` utility.
 */
export function PageTabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const barRef = React.useRef<HTMLSpanElement>(null);
  useIndicator(listRef, barRef);
  return (
    <div className={cn("w-full overflow-x-auto no-scrollbar", className)}>
      <TabsPrimitive.List
        ref={listRef}
        className="relative flex min-w-full border-b border-border bg-transparent p-0 h-auto"
        {...props}
      >
        {children}
        {/* The active underline, gliding between tabs (useIndicator). */}
        <span
          ref={barRef}
          aria-hidden
          className="pointer-events-none absolute -bottom-px left-0 h-0.5 w-[100px] origin-left bg-foreground opacity-0"
        />
      </TabsPrimitive.List>
    </div>
  );
}

/**
 * Page tab trigger — the list's sliding underline marks it, muted-to-foreground color
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
        "relative inline-flex h-10 items-center gap-1.5 px-3 first:ps-0",
        // Text
        "text-sm font-medium whitespace-nowrap text-muted-foreground",
        // Transitions (the underline is PageTabsList's sliding indicator)
        "transition-colors duration-base",
        // States
        "hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:rounded-sm",
        "disabled:pointer-events-none disabled:text-disabled-foreground",
        "data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
