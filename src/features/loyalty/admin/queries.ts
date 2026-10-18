import type { QueryClient } from "@tanstack/react-query";

import {
  getGetLoyaltyAnalyticsQueryOptions,
  getGetLoyaltyRewardItemsQueryOptions,
  getGetLoyaltySettingsQueryOptions,
  getListBranchesQueryOptions,
  getListLoyaltyMembersQueryOptions,
  getListMenuItemsQueryOptions,
} from "@/data/api/generated/api";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { loyaltySearch } from "./search";

/**
 * Every loyalty read is scoped the same way: a branch's row, or (no params)
 * the organisation's own. One builder for the panes AND the sidebar prefetch.
 */
export const programParams = (branchId: string | null): { branch_id?: string } =>
  branchId ? { branch_id: branchId } : {};

/** Sidebar/palette intent: warm Settings › Loyalty on the tab it will open. */
export function prefetchLoyaltySettings(qc: QueryClient, { orgId, branchId, search }: PrefetchCtx): void {
  if (!orgId) return;
  const params = programParams(branchId);
  void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  const { tab } = loyaltySearch.entryValues(branchId, search);
  if (tab === "program" || tab === "rewards") void qc.prefetchQuery(getGetLoyaltySettingsQueryOptions(params));
  if (tab === "rewards") {
    // The earning-items card shows only in visits mode, known once settings resolve.
    void qc.prefetchQuery(getGetLoyaltyRewardItemsQueryOptions(params));
    void qc.prefetchQuery(getListMenuItemsQueryOptions({ org_id: orgId }));
  }
  if (tab === "overview") {
    void qc.prefetchQuery(getGetLoyaltyAnalyticsQueryOptions(params));
    void qc.prefetchQuery(getListLoyaltyMembersQueryOptions({ ...params, limit: 1 }));
  }
  // Members is the Customers list (features/customers); its params belong there, so it is not warmed here.
}
