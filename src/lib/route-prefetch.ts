import type { QueryClient } from "@tanstack/react-query";
import type { ScopePreset } from "@/data/scope/presets";
import { routes as admin } from "@/lib/prefetch/admin";
import { routes as inventory } from "@/lib/prefetch/inventory";
import { routes as menu } from "@/lib/prefetch/menu";
import { routes as reports } from "@/lib/prefetch/reports";
import { routes as sales } from "@/lib/prefetch/sales";
import { routes as settings } from "@/lib/prefetch/settings";
import { routes as staff } from "@/lib/prefetch/staff";

export interface PrefetchCtx {
  orgId: string | null;
  /** The destination's scope (its URL search, as `useScope` will read it there). */
  branchId: string | null;
  from: string | null;
  to: string | null;
  /** Drives the dashboard timeseries granularity (hourly for intraday presets). */
  preset: ScopePreset;
  /** The destination's path params (`$itemId`), when the route has any. */
  params?: Record<string, string>;
  /**
   * The destination's validated search (a tab, a filter). A list page reads its
   * state through its `defineListSearch(…).entryValues(branchId, search)`:
   * the link's own params, else what the list remembers, else its defaults.
   */
  search?: Record<string, unknown>;
}

/** Warms one route's mount-time queries. */
export type RoutePrefetch = (qc: QueryClient, ctx: PrefetchCtx) => void;
export type RoutePrefetchMap = Record<string, RoutePrefetch>;

/**
 * Every app route that loads data → the queries its page fires on mount, one file per area
 * (`lib/prefetch/*`). Each entry builds its params with the SAME function the
 * page uses (a feature's `queries.ts`), so the warmed key is the page's key and,
 * with the global 30 s staleTime, the page renders from cache without a request.
 * Keys are route paths as the route tree spells them (`/menu/items/$itemId`),
 * without a trailing slash. `route-prefetch.test.ts` walks the route tree and
 * fails when a page route has neither an entry nor a place on `NOTHING_TO_WARM`.
 */
export const ROUTE_PREFETCH: RoutePrefetchMap = { ...sales, ...menu, ...reports, ...inventory, ...staff, ...admin, ...settings };

/**
 * Routes whose `beforeLoad` only redirects (old URLs kept working): a link to
 * one warms where it lands. The route-tree test checks each against the
 * redirect the route actually throws.
 */
export const REDIRECTS: Record<string, string> = {
  "/access": "/access/users",
  "/analytics": "/reports/operations",
  "/delivery": "/settings/delivery",
  "/delivery/channels": "/menu/pricing",
  "/delivery/settings": "/settings/delivery",
  "/delivery/zones": "/settings/delivery-zones",
  "/inventory": "/inventory/today",
  "/insights/inventory-reports": "/reports/inventory",
  "/insights/profitability": "/reports/operations",
  "/insights/sales": "/reports/operations",
  "/insights/tables": "/reports/operations",
  "/inventory/items": "/inventory/ingredients",
  "/inventory/reports": "/reports/inventory",
  "/kitchen/routing": "/settings/kitchen-routing",
  "/kitchen/stations": "/settings/kitchen-stations",
  "/menu": "/menu/items",
  "/menu/overrides": "/menu/pricing",
  "/menu/recipes": "/menu/items",
  "/permissions": "/access/roles",
  "/qr": "/settings/qr",
  "/reports/operations/profitability": "/reports/operations",
  "/reports/operations/tables": "/reports/operations",
  "/reports/sales": "/reports/operations",
  "/shifts": "/tills",
  "/users": "/access/users",
};

/**
 * Page routes with nothing worth warming: they read nothing from the server
 * on mount, or only what the app shell already holds, or they sit outside the
 * signed-in app. Every other page route needs an entry (the route-tree test).
 */
export const NOTHING_TO_WARM: Record<string, string> = {
  "/login": "signed out: no session to read with",
  "/signup": "signed out: no session to read with",
  "/settings": "Appearance: device preferences, nothing from the server",
};

/** A route path as the registry keys it: the tree's spelling without its trailing slash. */
export const routeKey = (fullPath: string): string => (fullPath.length > 1 ? fullPath.replace(/\/+$/, "") : fullPath);

/** Intent prefetch: warm `route`'s mount-time queries (no-op for unknown routes). */
export function prefetchRoute(route: string, { queryClient, ...ctx }: PrefetchCtx & { queryClient: QueryClient }): void {
  const key = routeKey(route);
  ROUTE_PREFETCH[REDIRECTS[key] ?? key]?.(queryClient, ctx);
}
