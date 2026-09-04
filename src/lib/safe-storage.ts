/**
 * `localStorage` that cannot take the app down.
 *
 * Reading `window.localStorage` is not safe. Safari throws `SecurityError` on
 * the property access itself when the user has "Block all cookies" set, and
 * both Safari and Firefox throw `QuotaExceededError` on write in private
 * browsing. Every one of those is thrown by code that runs at module scope —
 * store rehydration, theme, language detection — which is before React mounts,
 * so the failure is a blank page rather than a degraded one.
 *
 * The trade is not close. Losing a persisted sidebar preference is a nuisance;
 * a dashboard that will not open is an outage. Everything here fails soft, and
 * the app runs in memory for that session.
 */

/** In-memory stand-in, so a session still works when persistence does not. */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  } as Storage;
}

/**
 * True when `localStorage` can actually be read AND written. A round trip is
 * the only reliable probe: Safari in private browsing exposes the object and
 * fails only on `setItem`.
 */
function probe(): Storage | null {
  try {
    const s = window.localStorage;
    const k = "__madar_probe__";
    s.setItem(k, "1");
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

const real: Storage | null = typeof window === "undefined" ? null : probe();
const backing: Storage = real ?? memoryStorage();

/**
 * True when values written here will survive a reload. Exposed so a caller can
 * warn before relying on persistence, rather than discovering it silently.
 */
export const storageIsPersistent = real !== null;

/**
 * Drop-in `Storage` that never throws. Individual operations are guarded too,
 * not just the initial probe, because quota can be exhausted at any point.
 */
export const safeStorage: Storage = {
  get length() {
    try {
      return backing.length;
    } catch {
      return 0;
    }
  },
  clear: () => {
    try {
      backing.clear();
    } catch {
      /* persistence is best-effort */
    }
  },
  getItem: (k) => {
    try {
      return backing.getItem(k);
    } catch {
      return null;
    }
  },
  key: (i) => {
    try {
      return backing.key(i);
    } catch {
      return null;
    }
  },
  removeItem: (k) => {
    try {
      backing.removeItem(k);
    } catch {
      /* best-effort */
    }
  },
  setItem: (k, v) => {
    try {
      backing.setItem(k, v);
    } catch {
      /* best-effort */
    }
  },
} as Storage;
