import { redirect } from "@tanstack/react-router";

import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";

/**
 * List state in the URL — the one pattern every filtered list in the
 * dashboard uses (menu items, orders, inventory, staff, reports, …).
 *
 * A list page declares its filters ONCE with `defineListSearch(path, spec)`:
 *
 *   export const menuItemsSearch = defineListSearch("/menu/items", {
 *     tab: param.enum(["items", "addons", "categories"], "items"),
 *     cat: param.string(),
 *     q: param.string(),
 *     page: param.page(),
 *   });
 *
 * and wires it into its route (`validateSearch` + `beforeLoad`) and its page
 * (`useListFilters(menuItemsSearch)`). That buys, for every list alike:
 *
 * - **Shareable, reload-proof state.** Filters, search, sort, page and tab are
 *   typed search params. Defaults are never written, so an untouched list has a
 *   clean URL, and an invalid value (a hand-edited link, an old enum) falls back
 *   to the default instead of crashing the page.
 * - **State that survives navigation.** The last state of each list is
 *   remembered for the tab's session (per org). Arriving at the list with none of
 *   its params in the URL — a "Back" button, a breadcrumb, a save that returns
 *   to the list, the sidebar — restores it before the page renders. A link that
 *   names any filter of its own (`/orders?till=…`) wins and is shown as is.
 * - **Scroll.** List paths restore scroll by URL (`listScrollKey`), so returning
 *   to the same filtered view lands where the reader left off.
 * - **Branch-bound filters reset** on a branch switch (`branchScoped`), and an
 *   org switch never sees another org's memory.
 */

// ── Params ────────────────────────────────────────────────────────────────────

export interface Param<T> {
  /** Parse a raw search value; `undefined` = absent or invalid (→ default). */
  parse: (raw: unknown) => T | undefined;
  default: T;
  /** Cleared when the scoped branch changes (ids that belong to one branch). */
  branchScoped?: boolean;
  /** Changing this key does NOT reset `page` (it is the page, or a pure view
   *  toggle like a tab). Such keys are not "filters" for `isFiltered`. */
  keepsPage?: boolean;
  /** Not a filter (a sort order): never counted by `isFiltered`. */
  notAFilter?: boolean;
}

type AnyParam = Param<unknown>;
export type ListSpec = Record<string, AnyParam>;
export type ListValues<S extends ListSpec> = { [K in keyof S]: S[K]["default"] };
export type ListSearch<S extends ListSpec> = { [K in keyof S]?: S[K]["default"] };

const asString = (raw: unknown): string | undefined => {
  if (typeof raw === "string") return raw;
  // The router's parser turns `?q=12` into a number; a search box means text.
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return undefined;
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;

interface ParamOpts {
  branchScoped?: boolean;
  keepsPage?: boolean;
}

export const param = {
  /** Free text or an id. Default "" (absent). */
  string: (def = "", opts: ParamOpts = {}): Param<string> => ({
    parse: (raw) => asString(raw),
    default: def,
    ...opts,
  }),
  /** One of a fixed set (a tab, a status). Unknown values fall back to the default. */
  enum: <T extends string>(values: readonly T[], def: T, opts: ParamOpts = {}): Param<T> => ({
    parse: (raw) => {
      const s = asString(raw);
      return s !== undefined && (values as readonly string[]).includes(s) ? (s as T) : undefined;
    },
    default: def,
    ...opts,
  }),
  /** A whole number at or above `min`. */
  int: (def = 0, min = 0, opts: ParamOpts = {}): Param<number> => ({
    parse: (raw) => {
      const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
      return Number.isInteger(n) && n >= min ? n : undefined;
    },
    default: def,
    ...opts,
  }),
  /** 1-based page number, the way people read it in a URL. */
  page: (): Param<number> => ({ ...param.int(1, 1), keepsPage: true }),
  /** A boolean flag (`?flagged=true` / `1`). */
  bool: (def = false, opts: ParamOpts = {}): Param<boolean> => ({
    parse: (raw) => (raw === true || raw === "true" || raw === "1" || raw === 1 ? true : raw === false || raw === "false" || raw === "0" || raw === 0 ? false : undefined),
    default: def,
    ...opts,
  }),
  /** A calendar day, `YYYY-MM-DD`. Default "" (the page decides, e.g. today). */
  date: (def = "", opts: ParamOpts = {}): Param<string> => ({
    parse: (raw) => {
      const s = asString(raw);
      return s !== undefined && YMD.test(s) ? s : undefined;
    },
    default: def,
    ...opts,
  }),
  /** Table sort: `name` (ascending) or `-name` (descending). Default "" (unsorted). */
  sort: (def = ""): Param<string> => ({
    parse: (raw) => {
      const s = asString(raw);
      return s !== undefined && /^-?[A-Za-z0-9_.]+$/.test(s) ? s : undefined;
    },
    default: def,
    notAFilter: true,
  }),
};

// ── Pure helpers ─────────────────────────────────────────────────────────────

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** Parse the raw URL search into this list's keys, leaving defaults OUT. */
export function parseListSearch<S extends ListSpec>(spec: S, raw: Record<string, unknown>): ListSearch<S> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(spec)) {
    const v = spec[key].parse(raw[key]);
    if (v !== undefined && !same(v, spec[key].default)) out[key] = v;
  }
  return out as ListSearch<S>;
}

/** Every key filled: the URL value, else the default. */
export function withDefaults<S extends ListSpec>(spec: S, search: Record<string, unknown>): ListValues<S> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(spec)) {
    const v = spec[key].parse(search[key]);
    out[key] = v === undefined ? spec[key].default : v;
  }
  return out as ListValues<S>;
}

/**
 * The search patch for a change: defaults become `undefined` (the router drops
 * them from the URL), and changing any filter sends the list back to page 1 —
 * page 4 of the old result set is rarely page 4 of the new one.
 */
export function patchFor<S extends ListSpec>(spec: S, current: ListValues<S>, patch: Partial<ListValues<S>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let resetsPage = false;
  for (const key of Object.keys(patch)) {
    if (!(key in spec)) continue;
    const v = (patch as Record<string, unknown>)[key];
    const next = v === undefined ? spec[key].default : v;
    if (!same(next, current[key]) && !spec[key].keepsPage) resetsPage = true;
    out[key] = same(next, spec[key].default) ? undefined : next;
  }
  if (resetsPage && "page" in spec && !("page" in patch)) out.page = undefined;
  return out;
}

/** True when any filter differs from its default (offer "Clear filters").
 *  The page, tabs/view toggles (`keepsPage`), the sort and keys in `ignore` don't count. */
export function isFiltered<S extends ListSpec>(spec: S, values: ListValues<S>, ignore: (keyof S)[] = []): boolean {
  return Object.keys(spec).some(
    (k) => !ignore.includes(k) && !spec[k].keepsPage && !spec[k].notAFilter && !same(values[k], spec[k].default),
  );
}

// ── Session memory ───────────────────────────────────────────────────────────

interface Remembered {
  search: Record<string, unknown>;
  branchId: string | null;
}

const MEMORY_PREFIX = "madar.list.";
const fallbackMemory = new Map<string, string>();

/** Memory is per person and per org: a super-admin switching orgs never sees
 *  another org's filters, and the next person on a shared till never sees yours. */
function currentOwnerKey(): string {
  try {
    const user = useAuthStore.getState().user;
    const org = user?.role === "super_admin" ? useAppStore.getState().selectedOrgId : user?.org_id;
    return `${user?.id ?? "_"}:${org ?? "_"}`;
  } catch {
    return "_:_";
  }
}

const memoryKey = (path: string) => `${MEMORY_PREFIX}${currentOwnerKey()}:${path}`;

function readRaw(key: string): string | null {
  try {
    const v = sessionStorage.getItem(key);
    if (v !== null) return v;
  } catch {
    /* storage blocked (private mode, Tauri sandbox): fall through to memory */
  }
  return fallbackMemory.get(key) ?? null;
}

function writeRaw(key: string, value: string | null) {
  if (value === null) fallbackMemory.delete(key);
  else fallbackMemory.set(key, value);
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* the in-memory copy still serves this session */
  }
}

export function rememberListSearch(path: string, search: Record<string, unknown>, branchId: string | null) {
  const clean = Object.fromEntries(Object.entries(search).filter(([, v]) => v !== undefined));
  writeRaw(memoryKey(path), Object.keys(clean).length ? JSON.stringify({ search: clean, branchId } satisfies Remembered) : null);
}

export function recallListSearch(path: string): Remembered | null {
  const raw = readRaw(memoryKey(path));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Remembered;
    return parsed && typeof parsed.search === "object" && parsed.search ? parsed : null;
  } catch {
    return null;
  }
}

/** Forget every remembered list (sign-out). */
export function forgetAllListSearches() {
  fallbackMemory.clear();
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(MEMORY_PREFIX)) sessionStorage.removeItem(k);
    }
  } catch {
    /* nothing to clear */
  }
}

/**
 * What to restore when the list is entered with none of its own params:
 * the remembered search, minus branch-bound keys if the branch changed since.
 * `null` = nothing to do.
 */
export function restoreFor<S extends ListSpec>(
  spec: S,
  path: string,
  search: Record<string, unknown>,
): Record<string, unknown> | null {
  if (Object.keys(parseListSearch(spec, search)).length > 0) return null; // the URL already says what to show
  const mem = recallListSearch(path);
  if (!mem) return null;
  const branchId = typeof search.branchId === "string" ? search.branchId : null;
  const restored = parseListSearch(spec, mem.search) as Record<string, unknown>;
  if (mem.branchId !== branchId) for (const k of Object.keys(spec)) if (spec[k].branchScoped) delete restored[k];
  return Object.keys(restored).length ? restored : null;
}

// Signing out forgets every list (this tab's session would otherwise keep them).
try {
  useAuthStore.subscribe((state, prev) => {
    if (prev.user && !state.user) forgetAllListSearches();
  });
} catch {
  /* a test that mocks the store */
}

// ── Registry + scroll ────────────────────────────────────────────────────────

const listPaths = new Set<string>();

/** Scroll-restoration key: list paths restore by URL, so a "Back" PUSH to the
 *  same filtered view lands at the same scroll; everything else by history entry. */
export function listScrollKey(location: { pathname: string; href: string; state: { __TSR_key?: string } }): string {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (listPaths.has(path)) return location.href;
  return location.state.__TSR_key || location.href;
}

// ── Definition ───────────────────────────────────────────────────────────────

export interface ListSearchDef<S extends ListSpec> {
  path: string;
  spec: S;
  /** For the route: `validateSearch: def.validateSearch`. */
  validateSearch: (raw: Record<string, unknown>) => ListSearch<S>;
  /** For the route: `beforeLoad: def.beforeLoad` — restores the remembered state. */
  beforeLoad: (ctx: { search: Record<string, unknown>; preload?: boolean; cause?: string }) => void;
}

export function defineListSearch<S extends ListSpec>(path: string, spec: S): ListSearchDef<S> {
  listPaths.add(path);
  return {
    path,
    spec,
    validateSearch: (raw) => parseListSearch(spec, raw),
    beforeLoad: ({ search, preload, cause }) => {
      if (preload || cause === "preload") return;
      const restored = restoreFor(spec, path, search);
      if (!restored) return;
      throw redirect({ to: path as never, search: { ...search, ...restored } as never, replace: true });
    },
  };
}

/**
 * The scope params (`branchId`/`preset`/`from`/`to`, owned by `/_app`) and
 * nothing else — for a detail page's "Back" that returns to its list: the
 * list's own state is restored from memory, the detail's params (`?tab=`) are
 * left behind.
 */
export function keepScope(prev: Record<string, unknown>): Record<string, unknown> {
  const { branchId, preset, from, to } = prev;
  return { branchId, preset, from, to };
}
