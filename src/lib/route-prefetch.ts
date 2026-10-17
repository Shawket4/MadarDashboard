import type { QueryClient } from "@tanstack/react-query";
import type { ScopePreset } from "@/data/scope/presets";
import { routes as admin } from "@/lib/prefetch/admin";
import { routes as inventory } from "@/lib/prefetch/inventory";
import { routes as menu } from "@/lib/prefetch/menu";
import { routes as reports } from "@/lib/prefetch/reports";
import { routes as sales } from "@/lib/prefetch/sales";
import { routes as staff } from "@/lib/prefetch/staff";

export interface PrefetchCtx {
  orgId: string | null;
  branchId: string | null;
  from: string | null;
  to: string | null;
  /** Drives the dashboard timeseries granularity (hourly for intraday presets). */
  preset: ScopePreset;
}

/** Warms one route's mount-time queries. */
export type RoutePrefetch = (qc: QueryClient, ctx: PrefetchCtx) => void;
export type RoutePrefetchMap = Record<string, RoutePrefetch>;

/**
 * Every nav route → the queries its page fires on mount, one file per area
 * (`lib/prefetch/*`). Each entry builds its params with the SAME function the
 * page uses (a feature's `queries.ts`), so the warmed key is the page's key and,
 * with the global 30 s staleTime, the page renders from cache without a request.
 * `route-prefetch.test.ts` fails when a nav route has no entry.
 */
export const ROUTE_PREFETCH: RoutePrefetchMap = { ...sales, ...menu, ...reports, ...inventory, ...staff, ...admin };

/** Sidebar/palette hover or focus: warm `route`'s mount-time queries (no-op for unknown routes). */
export function prefetchRoute(route: string, { queryClient, ...ctx }: PrefetchCtx & { queryClient: QueryClient }): void {
  ROUTE_PREFETCH[route]?.(queryClient, ctx);
}
