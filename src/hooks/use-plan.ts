/**
 * The plan of the org in scope (Free / Paid) and what it allows.
 *
 * The plan lives in the auth store (set by sign-in, kept in storage) so the
 * nav, the route gate and the settings panes read it with no request of their
 * own. {@link useSyncPlan}, mounted once in the app shell, keeps it fresh:
 * `GET /auth/me` for the people who work in an org (every member may call it,
 * a branch manager included), `GET /orgs/{id}` for a super admin, whose scope
 * is the org they picked. An unknown plan reads as Paid (the generated
 * `hasFeature`), so a slow answer never hides a paying shop's pages.
 */
import { useEffect } from "react";

import { useGetOrg, useMe } from "@/data/api/generated/api";
import { useAuthStore } from "@/data/stores/auth.store";
import { hasFeature, type Feature } from "@/generated/plans";
import { useOrgId } from "@/hooks/use-org-id";

/** `free` | `paid`, null until known. */
export function usePlan(): string | null {
  return useAuthStore((s) => s.plan);
}

export function useIsFree(): boolean {
  return usePlan() === "free";
}

/** Whether the org in scope's plan includes a feature. */
export function useHasFeature(feature: Feature | undefined): boolean {
  const plan = usePlan();
  return feature === undefined || hasFeature(plan, feature);
}

/** Keeps the stored plan in step with the server. Mount once, in the app shell. */
export function useSyncPlan(): void {
  const token = useAuthStore((s) => s.token);
  const platform = useAuthStore((s) => s.user?.role === "super_admin");
  const orgId = useOrgId();
  const setPlan = useAuthStore((s) => s.setPlan);

  const me = useMe({ query: { enabled: !!token && !platform, staleTime: 60_000 } });
  const org = useGetOrg(orgId ?? "", { query: { enabled: platform && !!orgId, staleTime: 60_000 } });

  const fresh = platform ? (orgId ? org.data?.plan : null) : me.data?.plan;
  useEffect(() => {
    // A platform user between orgs has no plan; a member's stays what login said until /me answers.
    if (fresh !== undefined) setPlan(fresh ?? null);
  }, [fresh, setPlan]);
}
