import type { QueryClient } from "@tanstack/react-query";

import {
  getBranchDeliverySalesQueryOptions,
  getBranchSalesQueryOptions,
  getBranchSalesTimeseriesQueryOptions,
  getMarginWatchQueryOptions,
  getOrgBranchComparisonQueryOptions,
} from "@/data/api/generated/api";
import type { ScopePreset } from "@/data/scope/presets";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import { useAuthStore } from "@/data/stores/auth.store";
import { openTillsQueryOptions } from "@/features/tills/api";
import { hasFeature } from "@/generated/plans";
import type { PrefetchCtx } from "@/lib/route-prefetch";

/**
 * The dashboard's period params, built in ONE place: the page reads them and
 * the sidebar prefetch warms them, so both ask for the same cache keys.
 * Intraday presets chart by hour, the rest by day.
 */
export function dashboardParams(scope: { from: string | null; to: string | null; preset: ScopePreset }) {
  return {
    range: { from: scope.from ?? undefined, to: scope.to ?? undefined },
    granularity: scope.preset === "today" || scope.preset === "yesterday" ? ("hourly" as const) : ("daily" as const),
  };
}

/**
 * Sidebar/palette intent: warm every query the dashboard fires on mount, with
 * the page's own gates (branch picked, org resolved, plan features). The
 * onboarding nudge is gated by a capability and a session dismissal, so it is
 * left to fetch on mount.
 */
export function prefetchDashboard(qc: QueryClient, { orgId, branchId, from, to, preset }: PrefetchCtx): void {
  const { range, granularity } = dashboardParams({ from, to, preset });
  const scopeBranchId = branchId ?? ALL_BRANCHES_ID;
  const plan = useAuthStore.getState().plan;
  if (branchId) {
    void qc.prefetchQuery(getBranchSalesQueryOptions(branchId, { ...range }));
    void qc.prefetchQuery(openTillsQueryOptions(branchId));
  }
  if (!orgId) return;
  void qc.prefetchQuery(getBranchSalesTimeseriesQueryOptions(scopeBranchId, { ...range, granularity }));
  void qc.prefetchQuery(getOrgBranchComparisonQueryOptions(orgId, { ...range }));
  if (hasFeature(plan, "online")) void qc.prefetchQuery(getBranchDeliverySalesQueryOptions(scopeBranchId, { ...range }));
  if (hasFeature(plan, "inventory")) void qc.prefetchQuery(getMarginWatchQueryOptions(scopeBranchId, { ...range }));
}
