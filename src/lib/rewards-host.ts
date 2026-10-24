import { REWARDS_URL } from "@/config/nav";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";

/**
 * A page on Rewards by Madar's own host (`/members`, …), or null when this
 * build has none. A super admin's chosen shop rides along as `?org=`, so they
 * land on the same shop there (src/rewards-app reads it once).
 */
export function rewardsHref(path = "/", search = ""): string | null {
  if (!REWARDS_URL) return null;
  const url = new URL(`${REWARDS_URL}${path}${search}`);
  const superAdmin = useAuthStore.getState().user?.role === "super_admin";
  const org = useAppStore.getState().selectedOrgId;
  if (superAdmin && org) url.searchParams.set("org", org);
  return url.toString();
}
