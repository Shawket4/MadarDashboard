import { apiClient } from "@/data/api/client";
import { APP_TZ } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import type { UserPublic } from "@/data/types";

/* Public demo bootstrap (VITE_DEMO). Provisions a throwaway org via the demo
 * backend's POST /demo/session, signs the visitor in, and points the app at it.
 * Reuses an unexpired session of the same variant so a refresh doesn't spawn a
 * fresh org on every load. Tree-shaken out of non-demo builds (the dynamic
 * import in main.tsx only runs when VITE_DEMO is set). */

const DEMO_SESSION_KEY = "madar.demo.session";

export interface DemoSession {
  token: string;
  user: UserPublic;
  org_id: string;
  expires_at: string;
  variant: string;
}

export type DemoVariant = "full" | "empty";

/** Variant from `?variant=`; default `full` (an instantly-populated dashboard). */
export function requestedVariant(): DemoVariant {
  return new URLSearchParams(window.location.search).get("variant") === "empty" ? "empty" : "full";
}

export function getDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as DemoSession;
    // Treat as gone once within a minute of expiry, so we re-provision in time.
    if (!s.token || !s.expires_at || new Date(s.expires_at).getTime() < Date.now() + 60_000) return null;
    return s;
  } catch {
    return null;
  }
}

function applySession(s: DemoSession) {
  useAuthStore.getState().signIn(s.token, s.user);
  if (s.user.org_id) useAppStore.getState().setSelectedOrg(s.user.org_id);
  useAppStore.getState().setActiveTimezone(APP_TZ);
}

/** When running locally against the mock harness (dev:demo), start MSW first so
 *  POST /demo/session (and the rest of the API) is intercepted. No-op in a real
 *  demo build, which talks to the live demo backend. */
async function startMockWorkerIfNeeded(): Promise<void> {
  const flag = (import.meta.env as Record<string, string | undefined>).VITE_MOCK;
  if (import.meta.env.DEV && (flag === "1" || flag === "true")) {
    const { worker } = await import("@/data/api/mock/browser");
    await worker.start({ onUnhandledRequest: "bypass", serviceWorker: { url: "/mockServiceWorker.js" } });
  }
}

export async function enableDemo(): Promise<void> {
  await startMockWorkerIfNeeded();
  const variant = requestedVariant();

  const existing = getDemoSession();
  if (existing && existing.variant === variant) {
    applySession(existing);
    return;
  }

  const { data } = await apiClient.post<DemoSession>(`/demo/session?variant=${variant}`);
  try {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(data));
  } catch {
    /* private mode — session just won't survive a reload */
  }
  applySession(data);
}

/** "Reset" — discard this demo org and reload to get a fresh one. */
export function resetDemo(): void {
  try {
    localStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* ignore */
  }
  useAuthStore.getState().signOut();
  window.location.assign(window.location.pathname + window.location.search);
}
