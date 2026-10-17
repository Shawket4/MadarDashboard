import {
  getBranchInventoryValuationQueryOptions,
  getBranchLowStockQueryOptions,
  getBranchWasteReportQueryOptions,
  getGetInventorySettingsQueryOptions,
  getListBranchStockQueryOptions,
  getListBranchesQueryOptions,
  getListCatalogQueryOptions,
  getListPurchaseOrdersQueryOptions,
  getListStocktakesQueryOptions,
  getListSuppliersQueryOptions,
  getListTransfersQueryOptions,
  getListWasteQueryOptions,
  getOrgInventoryValuationQueryOptions,
  getOrgLowStockQueryOptions,
} from "@/data/api/generated/api";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

/** Sidebar/palette intent prefetch for the inventory area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  // The sidebar parent redirects to Today.
  "/inventory": (qc, ctx) => routes["/inventory/today"](qc, ctx),
  "/inventory/today": (qc, { orgId, branchId }) => {
    // Branch-scoped vs org roll-up, mirroring the page's branch/org split. The
    // org purchase-order list is keyed by a wall-clock cutoff, so it's left to
    // fetch on mount rather than risk a mismatched key.
    if (branchId) {
      void qc.prefetchQuery(getBranchInventoryValuationQueryOptions(branchId));
      void qc.prefetchQuery(getBranchLowStockQueryOptions(branchId));
      void qc.prefetchQuery(getListBranchStockQueryOptions(branchId));
      void qc.prefetchQuery(getListWasteQueryOptions(branchId));
    } else if (orgId) {
      void qc.prefetchQuery(getOrgInventoryValuationQueryOptions(orgId));
      void qc.prefetchQuery(getOrgLowStockQueryOptions(orgId));
    }
    if (orgId) {
      void qc.prefetchQuery(getListSuppliersQueryOptions(orgId));
      void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
    }
  },
  "/inventory/items": (qc, { orgId, branchId }) => {
    if (orgId) {
      void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
      void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
    }
    if (branchId) void qc.prefetchQuery(getListBranchStockQueryOptions(branchId));
  },
  "/inventory/ingredients": (qc, ctx) => routes["/inventory/items"](qc, ctx),
  "/inventory/purchasing": (qc, { orgId, branchId }) => {
    if (orgId) {
      void qc.prefetchQuery(getListSuppliersQueryOptions(orgId));
      void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
    }
    // Default status filter is "all" → undefined (matches the page's initial key).
    if (branchId) void qc.prefetchQuery(getListPurchaseOrdersQueryOptions(branchId, { status: undefined }));
  },
  "/inventory/counts": (qc, { branchId }) => {
    if (branchId) void qc.prefetchQuery(getListStocktakesQueryOptions(branchId));
  },
  "/inventory/waste": (qc, { branchId, from, to }) => {
    const period = { from: from ?? undefined, to: to ?? undefined };
    if (branchId) {
      void qc.prefetchQuery(getListWasteQueryOptions(branchId));
      void qc.prefetchQuery(getBranchWasteReportQueryOptions(branchId, period));
    }
  },
  "/inventory/transfers": (qc, { orgId, branchId }) => {
    if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
    // Default direction filter is "all" → undefined.
    if (branchId) void qc.prefetchQuery(getListTransfersQueryOptions(branchId, { direction: undefined }));
  },
  "/inventory/settings": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getGetInventorySettingsQueryOptions(orgId));
  },
};
