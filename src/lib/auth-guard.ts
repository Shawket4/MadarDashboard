import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/data/stores/auth.store";

/** Treat a token as expired only once it is this far past `exp` (clock skew). */
const EXP_SKEW_MS = 30_000;

/** Decode a JWT payload's `exp` (unix seconds). Returns null if unparseable. */
function tokenExpMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse(atob(b64)) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Route guard for `beforeLoad`. The auth store is backed by synchronous
 * localStorage persistence, so the token is already hydrated here.
 *
 * Besides presence, we check the token's `exp`: a present-but-expired token
 * would otherwise pass the guard and 401 on the first query. With no refresh
 * flow, that can strand the user on a data-less authenticated shell — so we
 * sign out and redirect to /login here, before any query fires. (Only `/_app`
 * wires this guard; the public /order and /track routes run tokenless and are
 * untouched.)
 */
export function requireAuth(href: string) {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw redirect({ to: "/login", search: { redirect: href } });
  }
  const expMs = tokenExpMs(token);
  if (expMs != null && Date.now() > expMs + EXP_SKEW_MS) {
    // Clear the dead token so /login doesn't bounce us straight back in.
    useAuthStore.getState().signOut();
    throw redirect({ to: "/login", search: { redirect: href } });
  }
}
