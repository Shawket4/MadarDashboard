/**
 * A prefetch is only worth its request when the page then reads the same
 * cache entry. For a sample of routes this renders the real app (route tree,
 * shell, page) at a URL with every request left hanging, records the query
 * keys the page asked for on mount, and compares them with the keys the
 * intent prefetch warms for the same destination (resolved the way a link
 * resolves it). The app shell's own reads (a page that reads nothing:
 * Settings › Appearance) are taken out of both.
 */
import { act, cleanup, render } from "@testing-library/react";
import { QueryClientProvider, hashKey, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter, type AnyRouter } from "@tanstack/react-router";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ConfirmProvider } from "@/components/app/confirm-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { apiClient } from "@/data/api/client";
import { getGetMyAuthzQueryKey, getGetOrgModulesQueryKey } from "@/data/api/generated/api";
import { queryClient } from "@/data/api/query";
import { forgetAllListSearches } from "@/data/scope/list-search";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { APP_TZ } from "@/data/config/constants";
import { Cap } from "@/generated/capabilities";
import { routeTree } from "@/routeTree.gen";
import { resolveTarget, warmResolved } from "./warm";

const ORG = "o1";
const BRANCH = "b1";
// A token that never expires (the auth guard reads `exp`).
const TOKEN = `x.${btoa(JSON.stringify({ exp: 4102444800 }))}.y`;

function seed(qc: QueryClient) {
  qc.setQueryData(getGetMyAuthzQueryKey(), {
    user_id: "u1", epoch: 1, spec_version: 1, owner: true, platform: false, role_kinds: ["org_admin"],
    capabilities: Object.values(Cap), ask_manager: [], limits: {}, everywhere: Object.values(Cap),
  });
  qc.setQueryData(getGetOrgModulesQueryKey(ORG), { modules: ["pos", "dawam"] });
}

/** The queries that asked the server (a disabled query sits in the cache too, never fetching). */
const keysOf = (qc: QueryClient) =>
  new Set(
    qc
      .getQueryCache()
      .getAll()
      .filter((q) => q.state.fetchStatus !== "idle" || q.state.data !== undefined)
      .map((q) => hashKey(q.queryKey)),
  );

let router: AnyRouter;

/** The keys the real app asks for on mount at `path?search`. */
async function pageKeys(path: string, search: Record<string, unknown>): Promise<Set<string>> {
  queryClient.clear();
  seed(queryClient);
  const qs = new URLSearchParams(Object.entries(search).map(([k, v]) => [k, String(v)])).toString();
  router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [qs ? `${path}?${qs}` : path] }) }) as unknown as AnyRouter;
  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConfirmProvider>
            <RouterProvider router={router as never} />
          </ConfirmProvider>
        </TooltipProvider>
      </QueryClientProvider>,
    );
    await router.load();
  });
  // Lazy route chunks and effects settle; nothing answers, so nothing data-dependent fires.
  for (let i = 0; i < 150; i++) {
    const leaf = router.state.matches.at(-1);
    if (router.state.status === "idle" && leaf && leaf.status === "success" && leaf.routeId !== "/_app") break;
    await act(() => new Promise((r) => setTimeout(r, 100)));
  }
  await act(() => new Promise((r) => setTimeout(r, 500)));
  const keys = keysOf(queryClient);
  cleanup();
  return keys;
}

/** The keys the intent prefetch warms for the same destination. */
function warmedKeys(path: string, search: Record<string, unknown>): Set<string> {
  const qc = queryClient;
  qc.clear();
  seed(qc);
  const before = keysOf(qc);
  const spy = vi.spyOn(qc, "prefetchQuery").mockResolvedValue(undefined);
  const r = resolveTarget(router, { to: path, search }, APP_TZ);
  expect(r, path).not.toBeNull();
  warmResolved(qc, ORG, r!);
  const keys = new Set(spy.mock.calls.map(([o]) => hashKey(o.queryKey as QueryKey)).filter((k) => !before.has(k)));
  spy.mockRestore();
  return keys;
}

const scoped = { branchId: BRANCH, preset: "today" };

/**
 * Destinations sampled across the areas: plain entries, a tab, path params,
 * branch scope. A third element names the reads a prefetch may warm one step
 * ahead: what the page asks for once its first answer lands (the studio's
 * sections render after the item does), so a hanging test page never asks.
 */
const SAMPLE: [string, Record<string, unknown>, string[]?][] = [
  ["/orders", scoped],
  ["/reports/operations", scoped],
  ["/reports/operations", { ...scoped, tab: "items" }],
  ["/reports/financial", { ...scoped, tab: "revenue" }],
  ["/menu/items", scoped],
  ["/menu/items/$itemId", scoped, ["/menu-items/m1", "/menu-items", "/categories", "/modifier-groups", "/combos", "/recipe-bases"]],
  ["/inventory/today", scoped],
  ["/staff/employees", scoped],
  ["/tills", scoped],
  ["/customers", scoped],
  ["/settings/kitchen-stations", scoped],
  ["/settings/payment-methods", { ...scoped, tab: "availability" }],
  ["/settings/plan", scoped],
  ["/settings/brand", scoped],
  ["/settings/kitchen-routing", { ...scoped, tab: "items" }],
  ["/settings/delivery", scoped],
  ["/access/roles", scoped],
  ["/bookings", scoped],
  ["/inventory/counts", scoped],
  ["/staff/attendance", scoped],
  ["/menu/combos/$comboId", scoped],
];

let shell: Set<string>;

beforeAll(async () => {
  // Every request hangs: the page shows its loading state and asks for nothing that waits on an answer.
  apiClient.defaults.adapter = () => new Promise(() => {});
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  useAuthStore.getState().signIn(TOKEN, { id: "u1", name: "Owner", email: "o@x", phone: "", role: "org_admin", org_id: ORG, branch_id: null, is_active: true }, "paid");
  useAppStore.getState().setSelectedOrg(ORG);
  useAppStore.getState().setActiveTimezone(APP_TZ);
  try {
    sessionStorage.setItem("madar.onboarding.skip", "1");
  } catch {
    /* jsdom has it */
  }
  shell = await pageKeys("/settings", scoped);
}, 60_000);

afterAll(() => {
  vi.unstubAllGlobals();
  forgetAllListSearches();
});

describe("intent prefetch warms the page's own query keys", () => {
  it.each(SAMPLE)("%s %o", async (path, search, later = []) => {
    const to = path.replace("$itemId", "m1").replace("$comboId", "c1");
    const page = [...(await pageKeys(to, search))].filter((k) => !shell.has(k)).sort();
    const warmed = [...warmedKeys(to, search)].filter((k) => !shell.has(k)).sort();
    expect(page.length, `${to} asked for nothing beyond the shell: the sample proves nothing`).toBeGreaterThan(0);
    // Every read the page opens with is a cache hit…
    expect(page.filter((k) => !warmed.includes(k)), "read on mount but not warmed").toEqual([]);
    // …and nothing is warmed that the page never reads.
    const ahead = (k: string) => later.some((p) => JSON.parse(k)[0] === p);
    expect(warmed.filter((k) => !page.includes(k) && !ahead(k)), "warmed but never read").toEqual([]);
  }, 60_000);
});
