/**
 * A stateful stand-in for the router's search params, for page tests that
 * mock `@tanstack/react-router`: `useSearch` reads an in-memory search object
 * and `useNavigate()({ search })` updates it (and re-renders readers), so a
 * page whose filters live in the URL (useListFilters) still reacts to clicks.
 *
 *   vi.mock("@tanstack/react-router", async () =>
 *     (await import("@/test/url-search-mock")).routerMock({ Link: … }));
 *
 * `urlSearch.reset()` between tests; `urlSearch.get()` to assert on the URL.
 */
import { useSyncExternalStore } from "react";

let current: Record<string, unknown> = {};
const listeners = new Set<() => void>();

export const urlSearch = {
  get: () => current,
  set(next: Record<string, unknown>) {
    current = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined));
    for (const l of listeners) l();
  },
  reset(next: Record<string, unknown> = {}) {
    urlSearch.set(next);
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSearch(): Record<string, unknown> {
  return useSyncExternalStore(subscribe, () => current);
}

type NavOpts = { search?: Record<string, unknown> | ((p: Record<string, unknown>) => Record<string, unknown>) };
const navigate = (opts: NavOpts) => {
  if (opts.search !== undefined) urlSearch.set(typeof opts.search === "function" ? opts.search(current) : opts.search);
  return Promise.resolve();
};

export function useNavigate() {
  return navigate;
}

/** The mocked module: these hooks plus whatever the test adds (Link, …). */
export function routerMock(extra: Record<string, unknown> = {}) {
  return { useSearch, useNavigate, redirect: (o: unknown) => o, ...extra };
}
