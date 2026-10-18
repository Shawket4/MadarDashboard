/**
 * The app shell's slow-changing reads, kept in IndexedDB between visits: who is
 * signed in (`/auth/me`), what they may do (`/authz/me`), the org, its modules,
 * its branches and its brand. A returning visit hydrates them before the first
 * render, so the sidebar, header and page gates draw at once, and every one of
 * them is refetched in the background as soon as it is used (they are restored
 * stale). Business data (orders, reports, stock) is never kept here.
 *
 * - At most MAX_AGE old; a new build (`buster`) or another person discards it.
 * - Cleared on sign-out and on an org switch (`clearShellCache`).
 * - Nothing that looks like a credential is ever written (`holdsSecret`).
 * - Storage is a convenience: any IndexedDB failure (private mode, a blocked
 *   origin, a slow open) means the app simply loads as it did before.
 */
import { createStore, del, get, set, type UseStore } from "idb-keyval";
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
  type PersistedClient,
  type Persister,
} from "@tanstack/query-persist-client-core";
import type { Query, QueryClient, QueryKey } from "@tanstack/react-query";

import { LS_KEYS } from "@/data/config/constants";
import { safeStorage } from "@/lib/safe-storage";

declare const __SENTRY_RELEASE__: string | undefined;

/** How old a kept shell may be and still be shown while it revalidates. */
export const MAX_AGE = 24 * 60 * 60 * 1000;
/** The longest boot waits for IndexedDB before rendering without it. */
const RESTORE_PATIENCE_MS = 250;
/** Writes are coalesced: the cache changes often, the shell rarely. */
const WRITE_THROTTLE_MS = 1000;
const ENTRY = "shell";

/** Is this one of the shell's reads? (The generated query keys: `[path, params?]`.) */
export function isShellQuery(key: QueryKey): boolean {
  const [head, ...rest] = key;
  if (typeof head !== "string") return false;
  if (head === "/auth/me" || head === "/branches" || head === "/public/orgs/brand") return true;
  // Only the person's own answer, not a per-branch read (`/authz/me?branch_id=`).
  if (head === "/authz/me") return rest.length === 0;
  return rest.length === 0 && /^\/orgs\/[^/]+(\/modules)?$/.test(head);
}

const SECRET = /token|secret|password|passcode|api[_-]?key|otp/i;

/** Whether a value carries anything credential-like anywhere in it: then it is not kept. */
export function holdsSecret(value: unknown, depth = 0): boolean {
  if (depth > 8 || value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((v) => holdsSecret(v, depth + 1));
  return Object.entries(value).some(([k, v]) => SECRET.test(k) || holdsSecret(v, depth + 1));
}

export function shouldPersist(query: Pick<Query, "queryKey" | "state">): boolean {
  return query.state.status === "success" && isShellQuery(query.queryKey) && !holdsSecret(query.state.data);
}

/** The build and the person: a kept shell from another of either is thrown away. */
export function shellBuster(): string {
  const release = typeof __SENTRY_RELEASE__ === "undefined" ? "dev" : __SENTRY_RELEASE__;
  let user = "";
  try {
    const raw = safeStorage.getItem(LS_KEYS.auth);
    user = (raw ? (JSON.parse(raw) as { state?: { user?: { id?: string } } }).state?.user?.id : "") ?? "";
  } catch {
    /* no one */
  }
  return `${release}|${user}`;
}

let idb: UseStore | null | undefined;
function store(): UseStore | null {
  if (idb !== undefined) return idb;
  try {
    idb = typeof indexedDB === "undefined" ? null : createStore("madar-shell", "queries");
  } catch {
    idb = null;
  }
  return idb;
}

let pending: ReturnType<typeof setTimeout> | null = null;
let latest: PersistedClient | null = null;

const persister: Persister = {
  persistClient(client) {
    latest = client;
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      const db = store();
      if (db && latest) void set(ENTRY, latest, db).catch(() => {});
    }, WRITE_THROTTLE_MS);
  },
  async restoreClient() {
    const db = store();
    return db ? await get<PersistedClient>(ENTRY, db) : undefined;
  },
  async removeClient() {
    const db = store();
    if (db) await del(ENTRY, db);
  },
};

/** Forget the kept shell (sign-out, an org switch), including a write still waiting. */
export function clearShellCache(): void {
  if (pending) clearTimeout(pending);
  pending = null;
  latest = null;
  const db = store();
  if (db) void del(ENTRY, db).catch(() => {});
}

/**
 * Hydrate the kept shell into `queryClient` (awaited by main.tsx beside the
 * rules, at most RESTORE_PATIENCE_MS), mark it stale so whatever uses it
 * refetches, then keep it up to date.
 */
export async function restoreShell(queryClient: QueryClient): Promise<void> {
  const buster = shellBuster();
  const restore = persistQueryClientRestore({ queryClient, persister, maxAge: MAX_AGE, buster })
    .then(() => {
      // Always revalidate: restored answers are shown, never trusted as fresh.
      void queryClient.invalidateQueries({ predicate: (q) => isShellQuery(q.queryKey), refetchType: "none" });
    })
    .catch(() => {})
    .finally(() => {
      // Kept up to date from here on (after the restore, so it never writes over it).
      try {
        persistQueryClientSubscribe({ queryClient, persister, buster, dehydrateOptions: { shouldDehydrateQuery: shouldPersist } });
      } catch {
        /* a convenience */
      }
    });
  await Promise.race([restore, new Promise((r) => setTimeout(r, RESTORE_PATIENCE_MS))]);
}
