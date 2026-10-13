import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { PaginationState, SortingState } from "@tanstack/react-table";

import {
  isFiltered,
  patchFor,
  rememberListSearch,
  withDefaults,
  type ListSearchDef,
  type ListSpec,
  type ListValues,
} from "./list-search";

export interface ListFilters<S extends ListSpec> {
  /** Every key, URL value or default. */
  values: ListValues<S>;
  /** Merge a patch into the URL (replace, no history spam). A changed filter
   *  resets `page`; `undefined` or the default clears a key. */
  set: (patch: Partial<ListValues<S>>) => void;
  /** Back to every default (keeps the tab when `keep` names it). */
  reset: (keep?: (keyof S)[]) => void;
  /** Any key off its default, ignoring `ignore` (e.g. the tab). */
  isFiltered: (ignore?: (keyof S)[]) => boolean;
}

/**
 * A list page's filters, bound to its route's search params. See
 * `list-search.ts` for the pattern; this is the page half.
 *
 *   const { values: f, set } = useListFilters(menuItemsSearch);
 *   <Select value={f.cat} onValueChange={(cat) => set({ cat })} />
 *
 * It also keeps the session memory current (what "Back" restores) and clears
 * `branchScoped` keys when the scoped branch changes.
 */
export function useListFilters<S extends ListSpec>(def: ListSearchDef<S>): ListFilters<S> {
  const raw = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();
  const { spec, path } = def;

  const values = useMemo(() => withDefaults(spec, raw), [spec, raw]);
  const branchId = typeof raw.branchId === "string" ? raw.branchId : null;

  // The URL is the truth; the memory follows it.
  const ownKeys = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(spec)) {
      const v = values[k];
      if (JSON.stringify(v) !== JSON.stringify(spec[k].default)) out[k] = v;
    }
    return out;
  }, [spec, values]);
  const ownKeysJson = JSON.stringify(ownKeys);
  useEffect(() => {
    rememberListSearch(path, JSON.parse(ownKeysJson) as Record<string, unknown>, branchId);
  }, [path, ownKeysJson, branchId]);

  const write = useCallback(
    (patch: Record<string, unknown>) => {
      // Memory first, so a `beforeLoad` that runs for this very navigation
      // (clearing every filter yields a bare URL) restores nothing stale.
      const next = { ...ownKeys, ...patch };
      rememberListSearch(path, next, branchId);
      void navigate({
        to: ".",
        replace: true,
        resetScroll: false,
        search: (p: Record<string, unknown>) => ({ ...p, ...patch }),
      } as never);
    },
    [navigate, ownKeys, path, branchId],
  );

  const set = useCallback(
    (patch: Partial<ListValues<S>>) => write(patchFor(spec, values, patch)),
    [spec, values, write],
  );

  const reset = useCallback(
    (keep: (keyof S)[] = []) => {
      const patch: Record<string, unknown> = {};
      for (const k of Object.keys(spec)) if (!keep.includes(k)) patch[k] = undefined;
      write(patch);
    },
    [spec, write],
  );

  // A branch switch clears filters that name things of the old branch.
  const prevBranch = useRef(branchId);
  const onBranchChange = useEffectEvent(() => {
    const patch: Record<string, unknown> = {};
    for (const k of Object.keys(spec)) {
      if (spec[k].branchScoped && JSON.stringify(values[k]) !== JSON.stringify(spec[k].default)) patch[k] = undefined;
    }
    if (Object.keys(patch).length) write({ ...patch, ...("page" in spec ? { page: undefined } : {}) });
  });
  useEffect(() => {
    if (prevBranch.current === branchId) return;
    prevBranch.current = branchId;
    onBranchChange();
  }, [branchId]);

  return {
    values,
    set,
    reset,
    isFiltered: useCallback((ignore: (keyof S)[] = []) => isFiltered(spec, values, ignore), [spec, values]),
  };
}

/**
 * Drop a filter value that no longer exists (a deleted category, a removed
 * supplier): once `known` has loaded and does not contain `value`, call
 * `clear`. The empty/default value is never "unknown".
 */
export function useDropUnknown(value: string, known: readonly string[] | undefined, clear: () => void, emptyValues: readonly string[] = ["", "all", "__all__"]) {
  const missing = !!known && !emptyValues.includes(value) && !known.includes(value);
  const onMissing = useEffectEvent(clear);
  useEffect(() => {
    if (missing) onMissing();
  }, [missing]);
}

/**
 * A search box over a URL param: typing stays instant (local state), the URL
 * follows after `delay` ms, and an outside change (Back, Clear filters) flows
 * back into the box.
 */
export function useSearchInput(value: string, commit: (v: string) => void, delay = 250): [string, (v: string) => void] {
  const [text, setText] = useState(value);
  const onCommit = useEffectEvent(commit);
  const lastCommitted = useRef(value);

  // Outside change → box.
  useEffect(() => {
    if (value !== lastCommitted.current) {
      lastCommitted.current = value;
      setText(value);
    }
  }, [value]);

  // Box → URL, debounced.
  useEffect(() => {
    if (text === lastCommitted.current) return;
    const id = setTimeout(() => {
      lastCommitted.current = text;
      onCommit(text);
    }, delay);
    return () => clearTimeout(id);
  }, [text, delay]);

  return [text, setText];
}

// ── DataTable binding ────────────────────────────────────────────────────────

/** `name` / `-name` ⇄ TanStack Table sorting state. */
export function sortToState(sort: string): SortingState {
  if (!sort) return [];
  return sort.startsWith("-") ? [{ id: sort.slice(1), desc: true }] : [{ id: sort, desc: false }];
}
export function stateToSort(state: SortingState): string {
  const first = state[0];
  return first ? `${first.desc ? "-" : ""}${first.id}` : "";
}

/** The props that put a `DataTable`'s search box, sort and page in the URL
 *  (the list's `q`, `sort` and `page` keys; any of them may be absent). */
export interface DataTableUrlState {
  search?: string;
  onSearchChange?: (q: string) => void;
  sorting?: SortingState;
  onSortingChange?: (s: SortingState) => void;
  pageIndex?: number;
  onPageIndexChange?: (i: number) => void;
}

export function tableStateFrom<S extends ListSpec>(
  f: ListFilters<S>,
  keys: { q?: string; sort?: string; page?: string } = {},
): DataTableUrlState {
  const v = f.values as Record<string, unknown>;
  const set = f.set as (p: Record<string, unknown>) => void;
  const qKey = keys.q ?? "q";
  const sortKey = keys.sort ?? "sort";
  const pageKey = keys.page ?? "page";
  const out: DataTableUrlState = {};
  if (typeof v[qKey] === "string") {
    out.search = v[qKey] as string;
    out.onSearchChange = (q) => set({ [qKey]: q, ...(pageKey in v && pageKey !== "page" ? { [pageKey]: undefined } : {}) });
  }
  if (typeof v[sortKey] === "string") {
    out.sorting = sortToState(v[sortKey] as string);
    out.onSortingChange = (s) => set({ [sortKey]: stateToSort(s) });
  }
  if (typeof v[pageKey] === "number") {
    out.pageIndex = (v[pageKey] as number) - 1;
    out.onPageIndexChange = (i) => set({ [pageKey]: i + 1 });
  }
  return out;
}

/** Server-paginated tables: `PaginationState` bound to the list's `page`. */
export function paginationFrom<S extends ListSpec>(f: ListFilters<S>, pageSize: number): {
  pagination: PaginationState;
  onPaginationChange: (u: PaginationState | ((old: PaginationState) => PaginationState)) => void;
} {
  const page = (f.values as Record<string, unknown>).page as number;
  const pagination = { pageIndex: page - 1, pageSize };
  return {
    pagination,
    onPaginationChange: (u) => {
      const next = typeof u === "function" ? u(pagination) : u;
      (f.set as (p: Record<string, unknown>) => void)({ page: next.pageIndex + 1 });
    },
  };
}
