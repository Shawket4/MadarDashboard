import {
  getListAddonCatalogQueryOptions,
  getListAddonItemsQueryOptions,
  getListBranchAddonOverridesQueryOptions,
  getListBranchMenuOverridesQueryOptions,
  getListCatalogQueryOptions,
  getListCategoriesQueryOptions,
  getListDiscountsQueryOptions,
  getListMenuCatalogQueryOptions,
  getListMenuItemsQueryOptions,
} from "@/data/api/generated/api";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

const MENU_PER_PAGE = 24; // ITEMS_PER_PAGE in menu-items-page

/** Sidebar/palette intent prefetch for the menu area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  "/menu": (qc, { orgId }) => {
    if (orgId) {
      void qc.prefetchQuery(getListMenuCatalogQueryOptions({ org_id: orgId, page: 1, per_page: MENU_PER_PAGE }));
      void qc.prefetchQuery(getListCategoriesQueryOptions({ org_id: orgId }));
      void qc.prefetchQuery(getListAddonItemsQueryOptions({ org_id: orgId }));
    }
  },
  "/menu/items": (qc, ctx) => routes["/menu"](qc, ctx),
  "/menu/overrides": (qc, { orgId, branchId }) => {
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
  },
  "/menu/recipes": (qc, { orgId }) => {
    if (orgId) {
      void qc.prefetchQuery(getListMenuItemsQueryOptions({ org_id: orgId }));
      void qc.prefetchQuery(getListAddonItemsQueryOptions({ org_id: orgId }));
      void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
    }
  },
  "/discounts": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getListDiscountsQueryOptions({ org_id: orgId }));
  },
};
