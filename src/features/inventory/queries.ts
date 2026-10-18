import type { QueryClient } from "@tanstack/react-query";

import {
  getBranchConsumptionQueryOptions,
  getBranchLowStockQueryOptions,
  getBranchShrinkageQueryOptions,
  getBranchWasteReportQueryOptions,
  getListBranchesQueryOptions,
  getListCatalogQueryOptions,
  getListPurchaseOrdersQueryOptions,
  getListSuppliersQueryOptions,
  getListTransfersQueryOptions,
  getOrgConsumptionQueryOptions,
  getOrgLowStockQueryOptions,
  getOrgShrinkageQueryOptions,
  getOrgWasteReportQueryOptions,
  getReorderSuggestionsQueryOptions,
  getTransferDifferencesQueryOptions,
} from "@/data/api/generated/api";
import type {
  ListMovementsParams, ListPurchaseLastPricesParams, ListPurchaseOrdersParams, ListTransfersParams,
} from "@/data/api/generated/models";
import type { ListValues } from "@/data/scope/list-search";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import { cairoDateISO, cairoParts } from "@/lib/format";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { inventoryReportsSearch, purchasingSearch, transfersSearch } from "./search";

/**
 * Inventory request params, built in ONE place: each page reads them and the
 * sidebar prefetch (lib/prefetch/inventory.ts) warms them, so both always ask
 * for the same cache key.
 */

/** The scope period as report params. */
export const periodParams = ({ from, to }: { from: string | null; to: string | null }) => ({
  from: from ?? undefined,
  to: to ?? undefined,
});

/** Today's business-day bounds in the active timezone (Today's waste cut-off and deliveries due). */
export function todayBounds(now: number = Date.now()): { start: string; end: string } {
  const { y, m, d } = cairoParts(now);
  return { start: cairoDateISO(y, m, d, false), end: cairoDateISO(y, m, d, true) };
}

/** An ingredient's stock history in the item drawer. */
export const itemMovementsParams = (orgIngredientId: string | undefined): ListMovementsParams => ({
  org_ingredient_id: orgIngredientId,
  per_page: 50,
});

// ── Purchasing ───────────────────────────────────────────────────────────────

type PurchasingValues = ListValues<typeof purchasingSearch.spec>;

/** The tab shown: Reorder needs one branch, so a remembered Reorder tab under "All branches" shows orders. */
export const purchasingTab = (f: PurchasingValues, branchId: string | null) =>
  f.tab === "reorder" && !branchId ? "orders" : f.tab;

export const purchaseOrdersParams = (f: PurchasingValues): ListPurchaseOrdersParams => ({
  status: f.status === "all" ? undefined : f.status,
});

/** The new-PO dialog's last prices: the chosen supplier's (else any supplier's); none chosen = no filter. */
export const lastPricesParams = (supplierId: string | null | undefined): ListPurchaseLastPricesParams | undefined =>
  supplierId ? { supplier_id: supplierId } : undefined;

export function prefetchPurchasing(qc: QueryClient, { orgId, branchId, search }: PrefetchCtx): void {
  if (!orgId) return;
  const f = purchasingSearch.entryValues(branchId, search);
  void qc.prefetchQuery(getListSuppliersQueryOptions(orgId));
  void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
  void qc.prefetchQuery(getListPurchaseOrdersQueryOptions(branchId ?? ALL_BRANCHES_ID, purchaseOrdersParams(f)));
  if (branchId && purchasingTab(f, branchId) === "reorder") void qc.prefetchQuery(getReorderSuggestionsQueryOptions(branchId));
}

// ── Transfers ────────────────────────────────────────────────────────────────

type TransfersValues = ListValues<typeof transfersSearch.spec>;

export const transfersListParams = (f: TransfersValues): ListTransfersParams => ({
  direction: f.dir === "all" ? undefined : f.dir,
  status: f.tab === "all" || f.tab === "differences" ? undefined : f.tab,
});

export function prefetchTransfers(qc: QueryClient, { orgId, branchId, from, to, search }: PrefetchCtx): void {
  if (!orgId) return;
  const f = transfersSearch.entryValues(branchId, search);
  void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  // Transfer locations load only with the create capability, which the prefetch can't see.
  if (f.tab === "differences") void qc.prefetchQuery(getTransferDifferencesQueryOptions(orgId, periodParams({ from, to })));
  else void qc.prefetchQuery(getListTransfersQueryOptions(branchId ?? ALL_BRANCHES_ID, transfersListParams(f)));
}

// ── Reports ▸ Inventory ──────────────────────────────────────────────────────

/** Reports ▸ Inventory (route owned by lib/prefetch/reports.ts): warm the tab it opens on. */
export function prefetchInventoryReports(qc: QueryClient, { orgId, branchId, from, to, search }: PrefetchCtx): void {
  if (!orgId) return;
  const f = inventoryReportsSearch.entryValues(branchId, search);
  // "This branch" needs a branch; under All branches the report is the whole org.
  const branch = f.scope === "branch" ? branchId : null;
  const range = periodParams({ from, to });
  switch (f.tab) {
    case "consumption":
      void qc.prefetchQuery(branch ? getBranchConsumptionQueryOptions(branch, range) : getOrgConsumptionQueryOptions(orgId, range));
      break;
    case "shrinkage":
      void qc.prefetchQuery(branch ? getBranchShrinkageQueryOptions(branch, range) : getOrgShrinkageQueryOptions(orgId, range));
      break;
    case "waste":
      void qc.prefetchQuery(branch ? getBranchWasteReportQueryOptions(branch, range) : getOrgWasteReportQueryOptions(orgId, range));
      break;
    case "lowStock":
      // The low-stock tab follows the branch, not the scope toggle.
      void qc.prefetchQuery(branchId ? getBranchLowStockQueryOptions(branchId) : getOrgLowStockQueryOptions(orgId));
      break;
    // PO lead time shows only with purchasing access (else Consumption), which the prefetch can't see.
  }
}
