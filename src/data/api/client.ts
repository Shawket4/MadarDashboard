import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/data/config/env";
import { LS_KEYS } from "@/data/config/constants";

/**
 * Ambient context held outside React. The auth store writes to this on sign in/out;
 * interceptors read from it to inject headers. This keeps the axios client framework-agnostic
 * and avoids React-coupling for HTTP concerns.
 */
interface AmbientContext {
  token: string | null;
  orgId: string | null;
  branchId: string | null;
  onUnauthorized: (() => void) | null;
}

const ctx: AmbientContext = {
  token: null,
  orgId: null,
  branchId: null,
  onUnauthorized: null,
};

export const apiContext = {
  setToken: (token: string | null) => {
    ctx.token = token;
  },
  setOrg: (orgId: string | null) => {
    ctx.orgId = orgId;
  },
  setBranch: (branchId: string | null) => {
    ctx.branchId = branchId;
  },
  setOnUnauthorized: (fn: (() => void) | null) => {
    ctx.onUnauthorized = fn;
  },
};

// Bootstrap from localStorage synchronously so the first request after a hard refresh
// already has the token — the Zustand store rehydrates in a microtask, by which point
// we may already have fired initial queries.
try {
  const persisted = localStorage.getItem(LS_KEYS.auth);
  if (persisted) {
    const parsed = JSON.parse(persisted) as { state?: { token?: string } };
    if (parsed.state?.token) ctx.token = parsed.state.token;
  }
} catch {
  /* ignore */
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (ctx.token) {
    config.headers.set("Authorization", `Bearer ${ctx.token}`);
  }
  if (ctx.orgId) config.headers.set("X-Org-Id", ctx.orgId);
  if (ctx.branchId) config.headers.set("X-Branch-Id", ctx.branchId);
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Only treat a 401 as DASHBOARD session-expiry when this request actually
      // carried our Bearer token AND targeted an authenticated endpoint. Without
      // this guard, a 401 from the public customer flow — e.g. a bad/absent guest
      // `device_token` on /order's history/locations calls, or any tokenless
      // request — would purge a valid session, clear the cache, and bounce the
      // user to the dashboard /login. Legitimately expired tokens are still sent
      // WITH the header on authenticated endpoints, so they still sign out.
      const h = err.config?.headers as { has?: (k: string) => boolean; Authorization?: unknown } | undefined;
      const sentAuth = !!(h && (typeof h.has === "function" ? h.has("Authorization") : h.Authorization));
      const isPublic = String(err.config?.url ?? "").includes("/public/");
      if (sentAuth && !isPublic) {
        // Delegate: the auth store wires itself as the handler, so it can purge
        // its own state, reset the token ambient, and redirect.
        ctx.onUnauthorized?.();
      }
    }
    return Promise.reject(err);
  },
);
