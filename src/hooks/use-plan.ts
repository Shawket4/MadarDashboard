/**
 * The plan of the org in scope (Free / Paid) and what it allows.
 *
 * The plan lives in the auth store (set by sign-in, kept in storage) so the
 * nav, the route gate and the settings panes read it with no request of their
 * own. {@link useSyncPlan}, mounted once in the app shell, keeps it fresh:
 * `GET /auth/me` for the people who work in an org (every member may call it,
 * a branch manager included), `GET /orgs/{id}/plan` for a super admin, whose
 * scope is the org they picked. Both carry the org's add-ons (Rewards by Madar: loyalty on
 * Free). An unknown plan reads as Paid (the generated
 * `hasFeature`), so a slow answer never hides a paying shop's pages.
 */
import { useEffect } from "react";

import { useGetOrgPlan, useMe } from "@/data/api/generated/api";
import { useAuthStore } from "@/data/stores/auth.store";
import { type Feature } from "@/generated/plans";
import { orgHasFeature } from "@/lib/plan-features";
import { useOrgId } from "@/hooks/use-org-id";

/** `free` | `paid`, null until known. */
export function usePlan(): string | null {
  // Subscribed to the add-ons too: every caller asks features with the plan,
  // and an add-on switched alone must re-render them.
  useAuthStore((s) => s.addons);
  return useAuthStore((s) => s.plan);
}

export function useIsFree(): boolean {
  return usePlan() === "free";
}

/** Whether the org in scope has a feature: its plan's, or an add-on's. */
export function useHasFeature(feature: Feature | undefined): boolean {
  const plan = usePlan();
  return feature === undefined || orgHasFeature(plan, feature);
}

/** Loyalty sold on its own: a Free org with the loyalty add-on (Rewards by Madar). */
export function useIsStandaloneLoyalty(): boolean {
  const plan = usePlan();
  const addons = useAuthStore((s) => s.addons);
  return plan === "free" && addons.includes("loyalty");
}

/** Keeps the stored plan in step with the server. Mount once, in the app shell. */
export function useSyncPlan(): void {
  const token = useAuthStore((s) => s.token);
  const platform = useAuthStore((s) => s.user?.role === "super_admin");
  const orgId = useOrgId();
  const setPlan = useAuthStore((s) => s.setPlan);

  const me = useMe({ query: { enabled: !!token && !platform, staleTime: 60_000 } });
  const org = useGetOrgPlan(orgId ?? "", { query: { enabled: platform && !!orgId, staleTime: 60_000 } });

  const src = platform ? (orgId ? org.data : null) : me.data;
  const fresh = src === undefined ? undefined : (src?.plan ?? null);
  const addons = (src?.addons ?? []).join(",");
  useEffect(() => {
    // A platform user between orgs has no plan; a member's stays what login said until /me answers.
    if (fresh !== undefined) setPlan(fresh, addons ? addons.split(",") : []);
  }, [fresh, addons, setPlan]);
}
