import { prefetchOrders } from "@/features/orders/queries";
import { openTillsQueryOptions } from "@/features/tills/api";
import {
  getBranchSalesQueryOptions,
  getBranchSalesTimeseriesQueryOptions,
  getOrgBranchComparisonQueryOptions,
} from "@/data/api/generated/api";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

/** Sidebar/palette intent prefetch for the sales area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  "/orders": prefetchOrders,
  "/": (qc, { orgId, branchId, preset, from, to }) => {
    const period = { from: from ?? undefined, to: to ?? undefined };
    // Dashboard: branch sales (when a branch is picked) + the org timeseries
    // and branch comparison (when an org resolves). Mirror each hook's exact
    // params — incl. the all-branches sentinel + granularity the page derives.
    const scopeBranchId = branchId ?? ALL_BRANCHES_ID;
    const granularity = preset === "today" || preset === "yesterday" ? "hourly" : "daily";
    if (branchId) void qc.prefetchQuery(getBranchSalesQueryOptions(branchId, period));
    if (orgId) {
      void qc.prefetchQuery(getBranchSalesTimeseriesQueryOptions(scopeBranchId, { ...period, granularity }));
      void qc.prefetchQuery(getOrgBranchComparisonQueryOptions(orgId, period));
    }
  },
  "/tills": (qc, { branchId }) => {
    if (branchId) {
      void qc.prefetchQuery(openTillsQueryOptions(branchId));
    }
  },
};
