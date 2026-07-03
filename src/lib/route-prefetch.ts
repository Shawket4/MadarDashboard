import type { QueryClient } from "@tanstack/react-query";
import {
  getBranchInventoryValuationQueryOptions,
  getBranchLowStockQueryOptions,
  getBranchMenuEngineeringQueryOptions,
  getBranchSalesQueryOptions,
  getBranchSalesTimeseriesQueryOptions,
  getBranchWasteReportQueryOptions,
  getGetActiveRunHandlerQueryOptions,
  getGetCurrentShiftQueryOptions,
  getGetInventorySettingsQueryOptions,
  getGetLatestRunHandlerQueryOptions,
  getListAddonItemsQueryOptions,
  getListAddonCatalogQueryOptions,
  getListBranchAddonOverridesQueryOptions,
  getListBranchMenuOverridesQueryOptions,
  getListBranchStockQueryOptions,
  getListBranchesQueryOptions,
  getListBundlesQueryOptions,
  getListCatalogQueryOptions,
  getListCategoriesQueryOptions,
  getListDiscountsQueryOptions,
  getListMenuCatalogQueryOptions,
  getListMenuItemsQueryOptions,
  getListOrdersQueryOptions,
  getListOrgsQueryOptions,
  getListPaymentMethodsQueryOptions,
  getListPurchaseOrdersQueryOptions,
  getListShiftsQueryOptions,
  getListStocktakesQueryOptions,
  getListSuppliersQueryOptions,
  getListTransfersQueryOptions,
  getListUsersQueryOptions,
  getListWasteQueryOptions,
  getOrgBranchComparisonQueryOptions,
  getOrgInventoryValuationQueryOptions,
  getOrgLowStockQueryOptions,
} from "@/data/api/generated/api";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import type { ScopePreset } from "@/data/scope/presets";

interface Ctx {
  queryClient: QueryClient;
  orgId: string | null;
  branchId: string | null;
  from: string | null;
  to: string | null;
  /** Drives the dashboard timeseries granularity (hourly for intraday presets). */
  preset: ScopePreset;
}

// Mirror the page-level query params EXACTLY so the warmed cache key is the one
// the page reads on mount (otherwise it refetches against a different key).
const MENU_PER_PAGE = 24; // ITEMS_PER_PAGE in menu-items-page
const ORDERS_PER_PAGE = 20; // pageSize in orders-page

/**
 * Warm every query a route fires on mount, when its sidebar entry is
 * hovered/focused — complements the router's code-chunk preload. With the
 * global 30s staleTime, the page then renders from cache without refetching.
 */
export function prefetchRoute(route: string, { queryClient: qc, orgId, branchId, from, to, preset }: Ctx): void {
  const period = { from: from ?? undefined, to: to ?? undefined };
  switch (route) {
    case "/": {
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
      break;
    }
    case "/orders":
      if (branchId || orgId) {
        // Must match orders-page `baseParams` shape exactly (incl. the filter
        // keys it leaves undefined) so the cache key is identical.
        void qc.prefetchQuery(getListOrdersQueryOptions({
          branch_id: branchId ?? undefined,
          from: from ?? undefined,
          to: to ?? undefined,
          status: undefined,
          payment_method: undefined,
          teller_name: undefined,
          waiter_name: undefined,
          page: 1,
          per_page: ORDERS_PER_PAGE,
        }));
      }
      break;
    case "/shifts":
      if (branchId) {
        void qc.prefetchQuery(getGetCurrentShiftQueryOptions(branchId));
        void qc.prefetchQuery(getListShiftsQueryOptions(branchId));
      }
      break;
    case "/menu":
    case "/menu/items":
      if (orgId) {
        void qc.prefetchQuery(getListMenuCatalogQueryOptions({ org_id: orgId, page: 1, per_page: MENU_PER_PAGE }));
        void qc.prefetchQuery(getListCategoriesQueryOptions({ org_id: orgId }));
        void qc.prefetchQuery(getListAddonItemsQueryOptions({ org_id: orgId }));
      }
      break;
    case "/menu/overrides":
      // Mirror the page's initial server params (branch-scoped, overridden-first
      // sort, page 1). The override lists feed the footers + the count badges.
      if (branchId) {
        void qc.prefetchQuery(getListBranchMenuOverridesQueryOptions({ branch_id: branchId }));
        void qc.prefetchQuery(getListBranchAddonOverridesQueryOptions({ branch_id: branchId }));
        if (orgId) {
          void qc.prefetchQuery(getListMenuCatalogQueryOptions({ org_id: orgId, branch_id: branchId, sort: "overridden", page: 1, per_page: MENU_PER_PAGE }));
          void qc.prefetchQuery(getListAddonCatalogQueryOptions({ org_id: orgId, branch_id: branchId, sort: "overridden", page: 1, per_page: MENU_PER_PAGE }));
          void qc.prefetchQuery(getListCategoriesQueryOptions({ org_id: orgId }));
        }
      }
      break;
    case "/menu/recipes":
      if (orgId) {
        void qc.prefetchQuery(getListMenuItemsQueryOptions({ org_id: orgId }));
        void qc.prefetchQuery(getListAddonItemsQueryOptions({ org_id: orgId }));
        void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
      }
      break;
    case "/menu/bundles":
      // Mirrors bundles-page's first server page (default sort/filter omitted).
      if (orgId) void qc.prefetchQuery(getListBundlesQueryOptions({ org_id: orgId, page: 1, per_page: 20 }));
      break;
    case "/menu/engineering":
    case "/insights/menu-profitability":
    case "/insights/menu-profitability/engineering":
      if (branchId) void qc.prefetchQuery(getBranchMenuEngineeringQueryOptions(branchId, { from: from ?? undefined, to: to ?? undefined }));
      break;
    case "/menu/advisor":
    case "/insights/menu-profitability/advisor":
      if (branchId) {
        void qc.prefetchQuery(getGetLatestRunHandlerQueryOptions(branchId));
        void qc.prefetchQuery(getGetActiveRunHandlerQueryOptions(branchId));
      }
      break;
    case "/discounts":
      if (orgId) void qc.prefetchQuery(getListDiscountsQueryOptions({ org_id: orgId }));
      break;
    case "/branches":
      if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
      break;
    case "/orgs":
      void qc.prefetchQuery(getListOrgsQueryOptions());
      break;
    case "/users":
    case "/permissions":
    case "/access":
    case "/access/users":
    case "/access/roles":
      if (orgId) void qc.prefetchQuery(getListUsersQueryOptions({ org_id: orgId }));
      break;
    case "/settings/payment-methods":
      if (orgId) void qc.prefetchQuery(getListPaymentMethodsQueryOptions());
      break;
    case "/analytics":
    case "/insights/sales":
      // Default tab is Overview → branch sales summary.
      if (branchId) void qc.prefetchQuery(getBranchSalesQueryOptions(branchId, period));
      break;
    case "/inventory": // sidebar parent + redirect target
    case "/inventory/today":
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
      break;
    case "/inventory/items":
    case "/inventory/ingredients":
      if (orgId) {
        void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
        void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
      }
      if (branchId) void qc.prefetchQuery(getListBranchStockQueryOptions(branchId));
      break;
    case "/inventory/purchasing":
      if (orgId) {
        void qc.prefetchQuery(getListSuppliersQueryOptions(orgId));
        void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
      }
      // Default status filter is "all" → undefined (matches the page's initial key).
      if (branchId) void qc.prefetchQuery(getListPurchaseOrdersQueryOptions(branchId, { status: undefined }));
      break;
    case "/inventory/counts":
      if (branchId) void qc.prefetchQuery(getListStocktakesQueryOptions(branchId));
      break;
    case "/inventory/waste":
      if (branchId) {
        void qc.prefetchQuery(getListWasteQueryOptions(branchId));
        void qc.prefetchQuery(getBranchWasteReportQueryOptions(branchId, period));
      }
      break;
    case "/inventory/transfers":
      if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
      // Default direction filter is "all" → undefined.
      if (branchId) void qc.prefetchQuery(getListTransfersQueryOptions(branchId, { direction: undefined }));
      break;
    case "/inventory/reports":
    case "/insights/inventory-reports":
      // Default tab is Valuation.
      if (orgId) void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
      if (branchId) void qc.prefetchQuery(getBranchInventoryValuationQueryOptions(branchId));
      else if (orgId) void qc.prefetchQuery(getOrgInventoryValuationQueryOptions(orgId));
      break;
    case "/inventory/settings":
      if (orgId) void qc.prefetchQuery(getGetInventorySettingsQueryOptions(orgId));
      break;
    // NOTE: every new data-backed module should add its mount-time query here
    // (matching the page's exact params) so sidebar hover warms it.
    default:
      break;
  }
}
