import { QueryClient, hashKey, type QueryKey } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, isRedirect, type AnyRoute } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

import { getGetMyAuthzQueryKey, getGetOrgModulesQueryKey, getGetOrgPlanQueryKey } from "@/data/api/generated/api";
import { Cap } from "@/generated/capabilities";

import { NAV, isParent } from "@/config/nav";
import { routeTree } from "@/routeTree.gen";
import { NOTHING_TO_WARM, REDIRECTS, ROUTE_PREFETCH, prefetchRoute, routeKey, type PrefetchCtx } from "./route-prefetch";

const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/"] }) });
const all = Object.values(router.routesById as unknown as Record<string, AnyRoute>);

/** Leaf routes (what a URL lands on), keyed as the registry keys them. */
const leaves = all.filter((r) => !r.children || (Array.isArray(r.children) ? r.children.length === 0 : Object.keys(r.children).length === 0));

/** Where a component-less route's `beforeLoad` sends a fresh visitor (null: it doesn't redirect). */
function redirectOf(route: AnyRoute): string | null {
  const beforeLoad = route.options.beforeLoad as ((ctx: unknown) => unknown) | undefined;
  if (!beforeLoad) return null;
  try {
    beforeLoad({ search: {}, params: {}, location: { href: route.fullPath, pathname: route.fullPath, search: {} }, preload: false, cause: "enter", context: {} });
  } catch (e) {
    if (isRedirect(e)) return routeKey(String(e.options.to));
    throw e;
  }
  return null;
}

const redirectRoutes = leaves.filter((r) => !r.options.component).map((r) => [routeKey(r.fullPath), redirectOf(r)] as const);
const pageRoutes = [...new Set(leaves.filter((r) => !!r.options.component).map((r) => routeKey(r.fullPath)))];
const known = new Set(leaves.map((r) => routeKey(r.fullPath)));

describe("ROUTE_PREFETCH covers the route tree", () => {
  it("found the tree", () => {
    expect(pageRoutes.length).toBeGreaterThan(60);
  });

  it.each(pageRoutes)("page route %s has a registry entry or a reason on NOTHING_TO_WARM", (route) => {
    const entry = ROUTE_PREFETCH[route];
    const reason = NOTHING_TO_WARM[route];
    expect(!!entry || !!reason, `add "${route}" to its area in src/lib/prefetch/ (or to NOTHING_TO_WARM with a reason)`).toBe(true);
    expect(!!entry && !!reason, `"${route}" is both warmed and on NOTHING_TO_WARM`).toBe(false);
  });

  it.each(redirectRoutes)("redirect route %s warms where it lands (%s)", (route, target) => {
    expect(target, `${route} has no component and no redirect`).not.toBeNull();
    expect(REDIRECTS[route], `add "${route}": "${target}" to REDIRECTS`).toBe(target);
    expect(ROUTE_PREFETCH[target!] ?? NOTHING_TO_WARM[target!], `${route} lands on ${target}, which is not covered`).toBeDefined();
  });

  // Every place the sidebar and the command palette can hover (a parent's base path may be no route: it unfolds its group).
  const navTargets = NAV.flatMap((g) => g.entries.flatMap((e) => (isParent(e) ? [e.basePath, ...e.children.map((c) => c.to)] : [e.to])));

  it("names no route the tree (or the sidebar) no longer has", () => {
    const stale = [...Object.keys(ROUTE_PREFETCH), ...Object.keys(REDIRECTS), ...Object.keys(NOTHING_TO_WARM)].filter(
      (r) => !known.has(r) && !navTargets.includes(r),
    );
    expect(stale).toEqual([]);
  });
  it.each(navTargets)("nav target %s warms something", (to) => {
    expect(ROUTE_PREFETCH[REDIRECTS[to] ?? to] ?? NOTHING_TO_WARM[to], to).toBeDefined();
  });
});

describe("a prefetch only reads", () => {
  const ctx: PrefetchCtx = { orgId: "o1", branchId: "b1", from: "2026-10-01T00:00:00Z", to: "2026-10-02T00:00:00Z", preset: "today", params: { itemId: "m1", comboId: "c1" }, search: {} };
  const seeded = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
    qc.setQueryData(getGetMyAuthzQueryKey(), { capabilities: Object.values(Cap) });
    qc.setQueryData(getGetOrgModulesQueryKey("o1"), { modules: ["pos", "dawam"] });
    return qc;
  };

  it.each(Object.keys(ROUTE_PREFETCH))("%s warms queries only: no mutation, no export download", (route) => {
    const qc = seeded();
    const fetchQuery = vi.spyOn(qc, "fetchQuery");
    const prefetch = vi.spyOn(qc, "prefetchQuery").mockResolvedValue(undefined);
    ROUTE_PREFETCH[route](qc, ctx);
    expect(qc.getMutationCache().getAll()).toEqual([]);
    expect(fetchQuery).not.toHaveBeenCalled();
    const keys = prefetch.mock.calls.map(([o]) => hashKey(o.queryKey as QueryKey));
    expect(keys.filter((k) => /export|download|\.csv|\.pdf/i.test(k))).toEqual([]);
  });

  it("asks nothing of the server while the cached answer is fresh (staleTime)", async () => {
    const qc = seeded();
    qc.setQueryData(getGetOrgPlanQueryKey("o1"), { plan: "paid" });
    const fetchSpy = vi.spyOn(qc, "prefetchQuery");
    prefetchRoute("/settings/plan", { queryClient: qc, ...ctx });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    await fetchSpy.mock.results[0].value;
    expect(qc.getQueryState(getGetOrgPlanQueryKey("o1"))?.fetchStatus).toBe("idle");
    expect(qc.getQueryState(getGetOrgPlanQueryKey("o1"))?.dataUpdateCount).toBe(1);
  });
});
