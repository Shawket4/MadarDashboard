/**
 * Auth headers for `fetch`-based streaming.
 *
 * `fetch` bypasses the axios interceptors, so anything streaming (SSE) has to
 * attach the same headers itself. Read from localStorage rather than from the
 * store so a hard refresh mid-stream still authenticates — the store rehydrates
 * in a microtask and a stream opened on mount can run first.
 *
 * Shared rather than copied: Basira and the floor board both need it, and an
 * auth header that drifts between two call sites fails in a way that looks like
 * a permissions bug.
 */
import { LS_KEYS } from "@/data/config/constants";

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  try {
    const persisted = localStorage.getItem(LS_KEYS.auth);
    if (persisted) {
      const parsed = JSON.parse(persisted) as {
        state?: { token?: string; orgId?: string; branchId?: string };
      };
      if (parsed.state?.token) headers.Authorization = `Bearer ${parsed.state.token}`;
      if (parsed.state?.orgId) headers["X-Org-Id"] = parsed.state.orgId;
      // The branch selector narrows scope server-side; sending it keeps a
      // streamed response scoped the same way a non-streamed one would be.
      if (parsed.state?.branchId) headers["X-Branch-Id"] = parsed.state.branchId;
    }
  } catch {
    /* An unreadable session surfaces as a 401, which callers already handle. */
  }
  return headers;
}
