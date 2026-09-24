/**
 * Dawam screens stay current (owner ask, 2026-09-24). A manager leaves the
 * dashboard for WhatsApp or the staff app and comes back to a board that is
 * already true: who clocked in, what waits on them, what the week looks like.
 *
 * Scoped to Dawam on purpose. The app-wide default (`data/api/query.ts`) keeps
 * `refetchOnWindowFocus: false`, so every other page behaves as it did; a
 * Dawam page READ opts in at its call site through `dawamQuery()`. Editors are
 * left out (the coverage grid, the dialogs, the Rules form for someone who
 * can edit it): they copy the answer into local state, and a refetch in the
 * background must never reset what someone is typing.
 *
 * Orval keys every query by its endpoint path, and every Dawam read lives
 * under `/staff/...`, so the page's Refresh button finds what is on screen by
 * that prefix (`dawamFilters`).
 */
import type { Query, QueryFilters } from "@tanstack/react-query";

/** The key prefix of every Dawam endpoint. */
export const DAWAM_KEY_PREFIX = "/staff";

/**
 * `true`, not `"always"`: TanStack refetches on focus only what is past its
 * staleTime (30 s app-wide), so coming back after half a minute or more
 * fetches the page again, and a quick glance away and back costs nothing.
 * `"always"` would refire every list on the page on every tab switch, for a
 * window that the mutations' own invalidation already covers.
 *
 * "Focus" is TanStack v5's: the tab becoming visible again (`visibilitychange`
 * — a tab switch, a minimised window restored). The Refresh button covers the
 * rest.
 */
const DAWAM_LIVE = { refetchOnWindowFocus: true } as const;

/**
 * The `query` options of a Dawam read, with the caller's own options kept
 * (`enabled`, `refetchInterval`, …) and allowed to override the focus refetch.
 *
 *   useTeamPresence(params, { query: dawamQuery({ enabled, refetchInterval: 60_000 }) })
 */
export function dawamQuery<T extends object = Record<never, never>>(
  query: T = {} as T,
): Omit<typeof DAWAM_LIVE, keyof T> & T {
  return { ...DAWAM_LIVE, ...query };
}

/** Does this query key sit under one of `prefixes`, on a path-segment boundary? */
export function keyUnder(queryKey: readonly unknown[], prefixes: readonly string[]): boolean {
  const head = queryKey[0];
  // `/staff-pool/...` (the POS staff drinks) is not `/staff`.
  return typeof head === "string" && prefixes.some((p) => head === p || head.startsWith(`${p}/`));
}

/**
 * The queries a Dawam page shows right now: mounted (`active`) and under one
 * of `prefixes`. What another page left in the cache is not refetched; it is
 * fetched again when that page mounts, as usual.
 */
export function dawamFilters(prefixes: readonly string[] = [DAWAM_KEY_PREFIX]): QueryFilters {
  return {
    type: "active",
    predicate: (q: Query) => keyUnder(q.queryKey, prefixes),
  };
}
