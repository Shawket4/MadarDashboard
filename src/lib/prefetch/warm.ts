import type { AnyRouter } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

import { prefetchRoute, type PrefetchCtx } from "@/lib/route-prefetch";
import { scopeFromSearch, type ScopeSearch } from "@/data/scope/use-scope";
import { STAYS } from "@/data/scope/list-search";
import type { NavTarget } from "./nav-context";

type BuildOpts = Parameters<AnyRouter["buildLocation"]>[0];

/**
 * A destination resolved the way the router will resolve it (`buildLocation`:
 * relative `to`, params, functional `search`, search validation) and matched
 * to its route: the registry key, the path params and the search, plus the
 * scope its page will read there. Null when it is not an app route.
 */
export function resolveTarget(router: AnyRouter, target: NavTarget, tz: string): { href: string; route: string; ctx: Omit<PrefetchCtx, "orgId"> } | null {
  let loc: ReturnType<AnyRouter["buildLocation"]>;
  try {
    loc = router.buildLocation(target as BuildOpts);
  } catch {
    return null;
  }
  const { foundRoute, routeParams } = router.getMatchedRoutes(loc.pathname);
  if (!foundRoute) return null;
  // A list's own tab or filter: it writes its memory before it navigates, so no restore applies (see STAYS).
  const stays = !!target.stays && loc.pathname === router.state.location.pathname;
  const search = stays ? { ...(loc.search as Record<string, unknown>), [STAYS]: true } : (loc.search as Record<string, unknown>);
  return {
    href: loc.href,
    route: foundRoute.fullPath,
    ctx: { ...scopeFromSearch(search as ScopeSearch, tz), params: routeParams, search },
  };
}

/** Warm a resolved destination's page queries (the registry entry for its route). */
export function warmResolved(qc: QueryClient, orgId: string | null, r: NonNullable<ReturnType<typeof resolveTarget>>): void {
  prefetchRoute(r.route, { queryClient: qc, orgId, ...r.ctx });
}
