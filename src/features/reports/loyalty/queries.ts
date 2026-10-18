import type { QueryClient } from "@tanstack/react-query";

import {
  getGetLoyaltyBehaviorQueryOptions,
  getGetLoyaltyCampaignEffectivenessQueryOptions,
  getGetLoyaltyLiabilityTrendQueryOptions,
} from "@/data/api/generated/api";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { loyaltyReportSearch } from "../search";

/** The loyalty report's window, built once for the page's three reads AND the sidebar prefetch. */
export const loyaltyReportRange = (s: { branchId: string | null; from: string | null; to: string | null }) => ({
  branch_id: s.branchId ?? undefined,
  from: s.from ?? undefined,
  to: s.to ?? undefined,
});

/** Sidebar/palette intent: the KPIs plus the tab the report opens on. */
export function prefetchLoyaltyReport(qc: QueryClient, ctx: PrefetchCtx): void {
  const range = loyaltyReportRange(ctx);
  void qc.prefetchQuery(getGetLoyaltyBehaviorQueryOptions(range));
  const { tab } = loyaltyReportSearch.entryValues(ctx.branchId, ctx.search);
  if (tab === "campaigns") void qc.prefetchQuery(getGetLoyaltyCampaignEffectivenessQueryOptions(range));
  if (tab === "liability") void qc.prefetchQuery(getGetLoyaltyLiabilityTrendQueryOptions(range));
}
