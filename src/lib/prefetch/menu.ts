import { prefetchCombos, prefetchMenuOptions } from "@/features/combos/queries";
import { packagingItemsParams, prefetchMenuItems, prefetchPricing } from "@/features/menu/queries";
import {
  getListBasesQueryOptions,
  getListCatalogQueryOptions,
  getListCategoriesQueryOptions,
  getListDealsQueryOptions,
  getListDiscountsQueryOptions,
  getListGroupsQueryOptions,
  getListMenuCatalogQueryOptions,
  getListRulesQueryOptions,
} from "@/data/api/generated/api";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

/** Sidebar/palette intent prefetch for the menu area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  "/menu/items": prefetchMenuItems,
  "/menu/groups": (qc, { orgId }) => {
    // Each group's usage count is one query per group id, known only once the list resolves.
    if (orgId) void qc.prefetchQuery(getListGroupsQueryOptions({ org_id: orgId, include_inactive: true }));
  },
  "/menu/combos": prefetchCombos,
  "/menu/deals": (qc, { orgId }) => {
    if (!orgId) return;
    void qc.prefetchQuery(getListDealsQueryOptions({}));
    prefetchMenuOptions(qc, orgId);
  },
  "/menu/pricing": prefetchPricing,
  "/menu/bases": (qc, { orgId }) => {
    if (!orgId) return;
    void qc.prefetchQuery(getListBasesQueryOptions());
    // The (closed) editor dialog's ingredient picker reads the catalog on mount.
    void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
  },
  "/menu/packaging": (qc, { orgId }) => {
    if (!orgId) return;
    void qc.prefetchQuery(getListRulesQueryOptions());
    void qc.prefetchQuery(getListCategoriesQueryOptions({ org_id: orgId }));
    void qc.prefetchQuery(getListMenuCatalogQueryOptions(packagingItemsParams(orgId)));
    // The (closed) rule dialog's ingredient picker reads the catalog on mount.
    void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
  },
  "/discounts": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getListDiscountsQueryOptions({ org_id: orgId }));
  },
};
