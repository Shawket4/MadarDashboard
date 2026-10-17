import type { QueryClient } from "@tanstack/react-query";

import { excludeItemsParam } from "@/components/app/exclude-items-control";
import {
  getBranchAddonSalesQueryOptions,
  getBranchChannelBreakdownQueryOptions,
  getBranchCombinedItemSalesQueryOptions,
  getBranchSalesPeakDaysQueryOptions,
  getBranchSalesPeakHoursQueryOptions,
  getBranchSalesQueryOptions,
  getBranchSalesTimeseriesQueryOptions,
  getBranchTellerStatsQueryOptions,
  getBranchWaiterStatsQueryOptions,
  getOrgBranchComparisonQueryOptions,
} from "@/data/api/generated/api";
import type { Range } from "./analytics-page";
import type { Granularity } from "./lib";

/**
 * The analytics tabs' requests, built in ONE place: each tab reads them and the
 * Reports sidebar prefetch warms them, so both ask for the same cache key.
 */
export const overviewParams = (range: Range, excludedItems: string[]) => ({ ...range, exclude_items: excludeItemsParam(excludedItems) });
export const itemSalesParams = (range: Range) => ({ ...range, limit: 50 });
export const addonSalesParams = (range: Range) => ({ ...range, limit: 20 });
export const tellerStatsParams = (range: Range) => ({ ...range, limit: 50 });
export const timeseriesParams = (range: Range, gran: Granularity) => ({ ...range, granularity: gran });

export type AnalyticsTab = "overview" | "revenue" | "channel" | "items" | "tellers" | "waiters" | "branches";

/** Warm one analytics tab's mount queries, as the tab will ask for them. */
export function prefetchAnalyticsTab(
  qc: QueryClient,
  tab: AnalyticsTab,
  { orgId, scopeBranchId, range, gran = "daily", excludedItems = [] }: {
    orgId: string | null;
    scopeBranchId: string;
    range: Range;
    gran?: Granularity;
    excludedItems?: string[];
  },
): void {
  switch (tab) {
    case "overview":
      void qc.prefetchQuery(getBranchSalesQueryOptions(scopeBranchId, overviewParams(range, excludedItems)));
      break;
    case "revenue":
      if (gran === "peak_hours") void qc.prefetchQuery(getBranchSalesPeakHoursQueryOptions(scopeBranchId, range));
      else if (gran === "peak_days") void qc.prefetchQuery(getBranchSalesPeakDaysQueryOptions(scopeBranchId, range));
      else void qc.prefetchQuery(getBranchSalesTimeseriesQueryOptions(scopeBranchId, timeseriesParams(range, gran)));
      break;
    case "channel":
      void qc.prefetchQuery(getBranchChannelBreakdownQueryOptions(scopeBranchId, range));
      break;
    case "items":
      void qc.prefetchQuery(getBranchCombinedItemSalesQueryOptions(scopeBranchId, itemSalesParams(range)));
      void qc.prefetchQuery(getBranchAddonSalesQueryOptions(scopeBranchId, addonSalesParams(range)));
      break;
    case "tellers":
      void qc.prefetchQuery(getBranchTellerStatsQueryOptions(scopeBranchId, tellerStatsParams(range)));
      break;
    case "waiters":
      void qc.prefetchQuery(getBranchWaiterStatsQueryOptions(scopeBranchId, range));
      break;
    case "branches":
      if (orgId) void qc.prefetchQuery(getOrgBranchComparisonQueryOptions(orgId, range));
      break;
  }
}
