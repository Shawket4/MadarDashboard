import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

/**
 * Ergonomic read/write for a page's own URL search params (tabs, filters,
 * pagination, opened item). The route must declare these keys in its
 * `validateSearch` so they survive navigation. `update` merges a patch and
 * replaces history (filter tweaks shouldn't spam the back stack); pass
 * `undefined` for a key to clear it.
 *
 * Scope params (branchId/preset/from/to) are owned by `/_app` and preserved
 * automatically — use `useScope()` for those.
 */
export function usePageSearch<T extends Record<string, unknown>>(): [Partial<T>, (patch: Partial<T>) => void] {
  const search = useSearch({ strict: false }) as Partial<T>;
  const navigate = useNavigate();
  const update = useCallback(
    (patch: Partial<T>) => void navigate({ to: ".", replace: true, search: (p: Record<string, unknown>) => ({ ...p, ...patch }) }),
    [navigate],
  );
  return [search, update];
}
