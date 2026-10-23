import { env } from "@/data/config/env";

/**
 * End this browser's session on the server (`DELETE /auth/session`): the
 * token stops working at once, here and in every other first-party app that
 * shares it (Rewards by Madar), instead of living until it expires.
 *
 * Fire-and-forget. Signing out never waits on the network and never fails:
 * offline, or against a backend from before sessions, the local sign-out
 * still happens and the token simply runs out. `keepalive` lets the request
 * finish while the page navigates to /login. A Tauri webview has no allowed
 * origin and is refused, which is harmless for the same reason.
 */
export function endServerSession(token: string | null): void {
  if (!token) return;
  try {
    void fetch(`${env.VITE_API_URL}/auth/session`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* a sign-out never fails */
  }
}
