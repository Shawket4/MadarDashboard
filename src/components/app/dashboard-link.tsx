import type { ReactNode } from "react";

import { Link } from "@/components/app/link";
import { env } from "@/data/config/env";
import { currentProduct } from "@/lib/product";

/**
 * A link to a Madar dashboard page from a page that also lives in Rewards by
 * Madar (src/rewards-app), whose router has only the Rewards pages. In the
 * dashboard it is an ordinary `<Link>`; in Rewards it opens the page on the
 * dashboard's host in a new tab (signed in by the shared session), or is plain
 * text when this build knows no dashboard host.
 */
export function DashboardLink({
  to,
  search,
  className,
  children,
}: {
  /** A dashboard path with no params (`/reports/loyalty`). */
  to: string;
  search?: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  if (currentProduct() === "dashboard") {
    return (
      <Link to={to as never} search={search as never} className={className}>
        {children}
      </Link>
    );
  }
  if (!env.VITE_DASHBOARD_URL) return <span className={className}>{children}</span>;
  const url = new URL(to, env.VITE_DASHBOARD_URL);
  for (const [k, v] of Object.entries(search ?? {})) url.searchParams.set(k, v);
  return (
    <a href={url.toString()} target="_blank" rel="noopener" className={className}>
      {children}
    </a>
  );
}
