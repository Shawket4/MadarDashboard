import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { useIndicator } from "@/lib/motion";
import { withIntent } from "@/lib/prefetch/intent";
import { tabTarget, useNavIntent, type NavTarget } from "@/lib/prefetch/nav-context";

/** Where the list's tabs go when they navigate (see `PageTabsList`'s `prefetch`). */
const TabPrefetchContext = React.createContext<string | ((value: string) => NavTarget | null) | undefined>(undefined);

/**
 * Scrollable page-level tab list — for multi-tab feature pages with many tabs.
 * Wraps Radix TabsPrimitive.List in an overflow-x-auto container; the inner
 * list stretches to at least full width so short lists don't float left.
 * Hides the scrollbar via the `no-scrollbar` utility.
 */
export function PageTabsList({
  className,
  children,
  prefetch,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  /**
   * When the tabs live in the URL: the search key they write (`"tab"`), or a
   * destination per tab value. Each trigger then warms its tab's data on
   * intent (hover, focus, pointerdown), like a link.
   */
  prefetch?: string | ((value: string) => NavTarget | null);
}) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const barRef = React.useRef<HTMLSpanElement>(null);
  useIndicator(listRef, barRef);
  return (
    <TabPrefetchContext.Provider value={prefetch}>
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
    </TabPrefetchContext.Provider>
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
  const prefetch = React.useContext(TabPrefetchContext);
  const nav = useNavIntent();
  const warm = prefetch && !props.disabled ? nav(tabTarget(prefetch, props.value)) : null;
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
      {...withIntent(props, warm)}
    />
  );
}
