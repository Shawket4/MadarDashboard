/**
 * The shared browser session, wired to the auth store (see `server-session.ts`
 * for the calls themselves). Both apps call these at boot:
 *
 *  - `adoptSharedSession()` before the first render: a signed-out app takes
 *    the browser's live shared session, so opening Rewards by Madar from the
 *    dashboard (or the reverse) needs no second sign-in;
 *  - `keepSessionShared()` once: every token the store holds from then on (a
 *    sign-in, a sign-up, the one already there at boot) is shared.
 */
import { env } from "@/data/config/env";
import { useAuthStore } from "@/data/stores/auth.store";
import type { MeResponse } from "@/data/api/generated/models";
import { adoptServerSession, shareServerSession, sharingEnabled } from "./server-session";

/**
 * Sign in with the shared session when this app has none. Resolves either way
 * (true when it signed in); never throws.
 */
export async function adoptSharedSession(): Promise<boolean> {
  if (useAuthStore.getState().token || !sharingEnabled()) return false;
  const token = await adoptServerSession();
  if (!token) return false;
  try {
    // The person behind it, through this app's own API base.
    const res = await fetch(`${env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const me = (await res.json()) as MeResponse;
    // Signed in meanwhile in this tab: keep that one.
    if (useAuthStore.getState().token) return false;
    useAuthStore.getState().signIn(token, me.user, me.plan ?? null);
    useAuthStore.getState().setPlan(me.plan ?? null, me.addons ?? []);
    return true;
  } catch {
    return false;
  }
}

/** Share every token the store holds, from now on. Returns the unsubscribe. */
export function keepSessionShared(): () => void {
  let last: string | null = null;
  const share = (token: string | null) => {
    if (token && token !== last) shareServerSession(token);
    last = token;
  };
  share(useAuthStore.getState().token);
  return useAuthStore.subscribe((s) => share(s.token));
}
