import { Link, useLocation } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export interface SectionTab {
  /** Target path (a valid app route). */
  to: string;
  /** Already-translated label. */
  label: string;
}

/** Carry only the branch + period scope across section navigation (drop
 *  page-specific selection like ?edit / ?user) so tabs keep scope but reset
 *  local state. Mirrors the sidebar's keepScope. */
const keepScope = (prev: Record<string, unknown>) => ({
  branchId: prev.branchId,
  preset: prev.preset,
  from: prev.from,
  to: prev.to,
});

/**
 * Shared section-level tab bar — the standardized cross-route sub-navigation for
 * multi-route sections (Delivery, Insights, Access). Renders a horizontal,
 * horizontally-scrollable row of `<Link>` tabs with the app's teal underline
 * indicator. Active state matches the current pathname (exact or nested).
 *
 * Use this for tabs that switch the URL *path*. For in-page tabs that switch a
 * search param, use PageTabs instead.
 */
export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const { pathname } = useLocation();
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <nav className="mx-auto flex w-full max-w-[1400px] min-w-full border-b border-border px-4 sm:px-6 lg:px-8">
        {tabs.map((tab) => {
          const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              search={keepScope}
              className={cn(
                "-mb-px inline-flex h-10 items-center px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150",
                "border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:rounded-sm",
                active
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
