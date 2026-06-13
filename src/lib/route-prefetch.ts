import type { QueryClient } from "@tanstack/react-query";
import {
  getBranchMenuEngineeringQueryOptions,
  getBranchSalesQueryOptions,
  getGetActiveRunHandlerQueryOptions,
  getGetCurrentShiftQueryOptions,
  getGetLatestRunHandlerQueryOptions,
  getListAddonItemsQueryOptions,
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
  getListShiftsQueryOptions,
  getListUsersQueryOptions,
} from "@/data/api/generated/api";

interface Ctx {
  queryClient: QueryClient;
  orgId: string | null;
  branchId: string | null;
  from: string | null;
  to: string | null;
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
export function prefetchRoute(route: string, { queryClient: qc, orgId, branchId, from, to }: Ctx): void {
  switch (route) {
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
    case "/menu/recipes":
      if (orgId) {
        void qc.prefetchQuery(getListMenuItemsQueryOptions({ org_id: orgId }));
        void qc.prefetchQuery(getListAddonItemsQueryOptions({ org_id: orgId }));
        void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
      }
      break;
    case "/menu/bundles":
      // Mirrors bundles-page params (page 1, large page size).
      if (orgId) void qc.prefetchQuery(getListBundlesQueryOptions({ org_id: orgId, page: 1, per_page: 500 }));
      break;
    case "/menu/engineering":
      if (branchId) void qc.prefetchQuery(getBranchMenuEngineeringQueryOptions(branchId, { from: from ?? undefined, to: to ?? undefined }));
      break;
    case "/menu/advisor":
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
      if (orgId) void qc.prefetchQuery(getListUsersQueryOptions({ org_id: orgId }));
      break;
    case "/settings/payment-methods":
      if (orgId) void qc.prefetchQuery(getListPaymentMethodsQueryOptions());
      break;
    case "/analytics":
      // Default tab is Overview → branch sales summary.
      if (branchId) void qc.prefetchQuery(getBranchSalesQueryOptions(branchId, { from: from ?? undefined, to: to ?? undefined }));
      break;
    // NOTE: every new data-backed module should add its mount-time query here
    // (matching the page's exact params) so sidebar hover warms it.
    default:
      break;
  }
}
