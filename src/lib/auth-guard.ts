import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/data/stores/auth.store";

/**
 * Route guard for `beforeLoad`. The auth store is backed by synchronous
 * localStorage persistence, so the token is already hydrated here.
 */
export function requireAuth(href: string) {
  if (!useAuthStore.getState().token) {
    throw redirect({ to: "/login", search: { redirect: href } });
  }
}
