import { createContext, useCallback, useContext, type ReactNode } from "react";

import { intent, type IntentHandlers } from "./intent";

/** A destination as `<Link>` and `navigate()` name it (`to`, `params`, `search` — a value or `prev => next`). */
export interface NavTarget {
  to?: string;
  from?: string;
  params?: unknown;
  search?: unknown;
  hash?: unknown;
  /**
   * A list page's own tab or filter (`useListFilters().set`), which writes the
   * list's memory before it navigates: the destination is exactly its search,
   * with nothing restored from memory (`STAYS` in data/scope/list-search).
   */
  stays?: boolean;
}

/** Warm a destination now (deduped); `code: false` when the router already preloads its chunk (a `<Link>`). */
export type WarmRoute = (target: NavTarget | string, opts?: { code?: boolean }) => void;

/**
 * The route warm-up, from the dashboard shell (`useRoutePrefetch`). Shared
 * components (`Link`, `PageTabsList`, `DataTable`) read it from here, so they
 * carry no dependency on the dashboard's registry: in a public bundle, or a
 * test without the provider, there is none and they warm nothing.
 */
const NavPrefetchContext = createContext<WarmRoute | null>(null);

export function NavPrefetchProvider({ warm, children }: { warm: WarmRoute; children: ReactNode }) {
  return <NavPrefetchContext.Provider value={warm}>{children}</NavPrefetchContext.Provider>;
}

/** The raw warm-up (null outside the dashboard shell). */
export function useWarmRoute(): WarmRoute | null {
  return useContext(NavPrefetchContext);
}

/**
 * Intent handlers for a navigation: `const nav = useNavIntent();` then
 * `<Button {...nav({ to: "/menu/pricing", search: keepScope })} onClick={…}>`
 * or, for a tab that patches the URL, `nav({ to: ".", search: (p) => ({ ...p, tab }) })`.
 * Returns null (spreads to nothing) outside the dashboard shell.
 */
export function useNavIntent(opts?: { code?: boolean }): (target: NavTarget | string | null) => IntentHandlers | null {
  const warm = useWarmRoute();
  const code = opts?.code;
  return useCallback(
    (target: NavTarget | string | null) => (warm && target ? intent(null, () => warm(target, { code })) : null),
    [warm, code],
  );
}

/**
 * A tab or segment's destination: `key` is the search param it writes (the
 * same route, that one param changed), or a function naming the destination.
 */
export function tabTarget<V extends string>(how: string | ((value: V) => NavTarget | null), value: V): NavTarget | null {
  if (typeof how === "function") return how(value);
  return { to: ".", search: (prev: Record<string, unknown>) => ({ ...prev, [how]: value }), stays: true };
}
