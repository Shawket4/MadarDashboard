import { env } from "@/data/config/env";

/**
 * The browser session the dashboard and Rewards by Madar share
 * (`/auth/session` on the backend, an HttpOnly cookie the page never reads).
 *
 * Both apps call the API through their own host's `/api`, so the cookie lives
 * on one of them: the Rewards host. Rewards reaches it same-origin; the
 * dashboard cross-origin, with credentials (`VITE_SESSION_URL`). Each app still
 * signs in on its own; this only hands the token across:
 *  - after a sign-in (and on every boot that has one) the app SHARES it;
 *  - an app that boots signed out ADOPTS the shared one, if it is live;
 *  - signing out ENDS it on the server, so the other app's copy stops working.
 *
 * Every call is best effort. Offline, against an older backend, or from an
 * origin the server does not allow (the desktop app, the demo), the app simply
 * keeps its own session.
 */
const base = (): string => env.VITE_SESSION_URL ?? env.VITE_API_URL;
const url = (): string => `${base()}/auth/session`;

const flags = import.meta.env as Record<string, string | boolean | undefined>;
const on = (v: unknown) => v === true || v === "1" || v === "true";

/**
 * Whether this build shares at all: not the demo (its own API), not the mock
 * preview, not the desktop app (its origin is allowed nowhere).
 */
export function sharingEnabled(): boolean {
  if (on(flags.VITE_DEMO) || on(flags.VITE_MOCK)) return false;
  return typeof window === "undefined" || !("__TAURI_INTERNALS__" in window);
}

/** Keep `token` as this browser's shared session. Fire-and-forget. */
export function shareServerSession(token: string | null): void {
  if (!token || !sharingEnabled()) return;
  try {
    void fetch(url(), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    }).catch(() => undefined);
  } catch {
    /* sharing is a convenience */
  }
}

/**
 * The shared session's token, when this browser has a live one; else null.
 * Bounded by `timeoutMs`, because a signed-out boot waits on it.
 */
export async function adoptServerSession(timeoutMs = 2500): Promise<string | null> {
  if (!sharingEnabled()) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url(), { credentials: "include", signal: ctl.signal });
    if (!res.ok) return null;
    const body = (await res.json()) as { token?: unknown };
    return typeof body.token === "string" && body.token ? body.token : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * End this browser's session on the server (`DELETE /auth/session`): the
 * token stops working at once, here and in the other app, instead of living
 * until it expires.
 *
 * Fire-and-forget. Signing out never waits on the network and never fails:
 * the local sign-out still happens and the token simply runs out. `keepalive`
 * lets the request finish while the page navigates to its sign-in.
 */
export function endServerSession(token: string | null): void {
  if (!token) return;
  try {
    void fetch(url(), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* a sign-out never fails */
  }
}
