import {
  getBranchInventoryValuationQueryOptions,
  getBranchLowStockQueryOptions,
  getBranchWasteReportQueryOptions,
  getGetInventorySettingsQueryOptions,
  getListBranchStockQueryOptions,
  getListBranchesQueryOptions,
  getListCatalogQueryOptions,
  getListIngredientCategoriesQueryOptions,
  getListOrgPurchaseOrdersQueryOptions,
  getListStocktakesQueryOptions,
  getListSuppliersQueryOptions,
  getListWasteQueryOptions,
  getOrgInventoryValuationQueryOptions,
  getOrgLowStockQueryOptions,
} from "@/data/api/generated/api";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import { periodParams, prefetchPurchasing, prefetchTransfers, todayBounds, wasteListParams } from "@/features/inventory/queries";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

/** Sidebar/palette intent prefetch for the inventory area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  "/inventory/today": (qc, { orgId, branchId }) => {
    // Branch-scoped vs org roll-up, mirroring the page's branch/org split.
    if (branchId) {
      void qc.prefetchQuery(getBranchInventoryValuationQueryOptions(branchId));
      void qc.prefetchQuery(getBranchLowStockQueryOptions(branchId));
      void qc.prefetchQuery(getListBranchStockQueryOptions(branchId));
      void qc.prefetchQuery(getListStocktakesQueryOptions(branchId));
      void qc.prefetchQuery(getListWasteQueryOptions(branchId));
    } else if (orgId) {
      void qc.prefetchQuery(getOrgInventoryValuationQueryOptions(orgId));
      void qc.prefetchQuery(getOrgLowStockQueryOptions(orgId));
    }
    if (orgId) {
      void qc.prefetchQuery(getListOrgPurchaseOrdersQueryOptions(orgId, { expected_before: todayBounds().end }));
      void qc.prefetchQuery(getListSuppliersQueryOptions(orgId));
      void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
    }
  },
  "/inventory/ingredients": (qc, { orgId, branchId }) => {
    // Filter/search/sort/page are client-side over these lists: no params to match.
    if (orgId) {
      void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
      void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
    }
    if (branchId) {
      void qc.prefetchQuery(getListBranchStockQueryOptions(branchId));
      void qc.prefetchQuery(getListStocktakesQueryOptions(branchId));
    }
  },
  "/inventory/purchasing": prefetchPurchasing,
  "/inventory/counts": (qc, { orgId, branchId }) => {
    // The open count's editor keys on an id from this list, so it fetches on mount.
    if (orgId) void qc.prefetchQuery(getListStocktakesQueryOptions(branchId ?? ALL_BRANCHES_ID));
    // The catalog it reads to mark archived ingredients.
    if (orgId) void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
  },
  "/inventory/waste": (qc, { orgId, branchId, from, to }) => {
    if (!orgId) return;
    // The log and the by-reason report roll up org-wide under "All branches".
    const scopeBranchId = branchId ?? ALL_BRANCHES_ID;
    void qc.prefetchQuery(getListWasteQueryOptions(scopeBranchId, wasteListParams()));
    void qc.prefetchQuery(getBranchWasteReportQueryOptions(scopeBranchId, periodParams({ from, to })));
  },
  "/inventory/transfers": prefetchTransfers,
  "/inventory/settings": (qc, { orgId }) => {
    if (orgId) {
      void qc.prefetchQuery(getGetInventorySettingsQueryOptions(orgId));
      void qc.prefetchQuery(getListIngredientCategoriesQueryOptions(orgId));
    }
  },
};
