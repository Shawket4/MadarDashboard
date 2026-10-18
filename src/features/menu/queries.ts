import type { QueryClient } from "@tanstack/react-query";

import {
  getGetMenuItemQueryOptions,
  getGetStudioQueryOptions,
  getListAddonCatalogQueryOptions,
  getListAddonCostsQueryOptions,
  getListAddonItemsQueryOptions,
  getListBasesQueryOptions,
  getListBranchAddonOverridesQueryOptions,
  getListBranchMenuOverridesQueryOptions,
  getListBranchesQueryOptions,
  getListCatalogQueryOptions,
  getListCategoriesQueryOptions,
  getListChannelAddonOverridesQueryOptions,
  getListCombosQueryOptions,
  getListGroupsQueryOptions,
  getListMenuCatalogQueryOptions,
  getListMenuItemsQueryOptions,
  getListStepPresetsQueryOptions,
} from "@/data/api/generated/api";
import type { ListAddonCatalogParams, ListMenuCatalogParams } from "@/data/api/generated/models";
import type { ListValues } from "@/data/scope/list-search";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { pricingSearch } from "./pricing/search";
import { menuItemsSearch } from "./search";

export const MENU_ITEMS_PAGE_SIZE = 24;
export const PRICING_PAGE_SIZE = 24;
/** The delivery channels the pricing matrix reads add-on overrides for, one query each. */
export const PRICING_CHANNELS = ["in_mall", "outside", "umbrella", "pickup"] as const;

/**
 * Menu › Items grid request, built in ONE place: the page reads it and the
 * sidebar prefetch warms it, so both ask for the same cache key. The recipe
 * filter is sent only with recipes.read (the page offers it only then).
 */
export function menuItemsListParams(
  orgId: string | null,
  f: ListValues<typeof menuItemsSearch.spec>,
  canFilterRecipes: boolean,
): ListMenuCatalogParams {
  return {
    org_id: orgId ?? "",
    category_id: f.cat || undefined,
    search: f.q || undefined,
    has_recipe: !canFilterRecipes || f.recipe === "all" ? undefined : f.recipe === "has",
    page: f.page,
    per_page: MENU_ITEMS_PAGE_SIZE,
  };
}

/** Sidebar/palette intent: warm Menu › Items exactly as the page will open it. */
export function prefetchMenuItems(qc: QueryClient, { orgId, branchId, search }: PrefetchCtx): void {
  if (!orgId) return;
  const f = menuItemsSearch.entryValues(branchId, search);
  // A remembered recipe filter was set with recipes.read, so assume it is still held.
  void qc.prefetchQuery(getListMenuCatalogQueryOptions(menuItemsListParams(orgId, f, true)));
  void qc.prefetchQuery(getListCategoriesQueryOptions({ org_id: orgId }));
  void qc.prefetchQuery(getListAddonItemsQueryOptions({ org_id: orgId }));
  if (f.tab === "addons") void qc.prefetchQuery(getListAddonCostsQueryOptions({ org_id: orgId }));
  if (branchId) {
    void qc.prefetchQuery(getListBranchMenuOverridesQueryOptions({ branch_id: branchId }));
    void qc.prefetchQuery(getListBranchAddonOverridesQueryOptions({ branch_id: branchId }));
  }
}

/**
 * Row intent: warm what the Menu Studio (`/menu/items/$itemId`) reads on open.
 * The preview's dry run is keyed by the draft it builds, so it is left to load.
 */
export function prefetchMenuStudio(qc: QueryClient, orgId: string | null, itemId: string, hasRecipes: boolean): void {
  void qc.prefetchQuery(getGetStudioQueryOptions(itemId));
  void qc.prefetchQuery(getGetMenuItemQueryOptions(itemId));
  if (!orgId) return;
  void qc.prefetchQuery(getListCategoriesQueryOptions({ org_id: orgId }));
  void qc.prefetchQuery(getListGroupsQueryOptions({ org_id: orgId }));
  // "Make it a meal": the combos it can join and the menu options (features/combos/use-menu-options).
  void qc.prefetchQuery(getListCombosQueryOptions({ per_page: 200 }));
  void qc.prefetchQuery(getListMenuItemsQueryOptions({ org_id: orgId, full: true }));
  void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  if (hasRecipes) {
    void qc.prefetchQuery(getListStepPresetsQueryOptions());
    void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
    void qc.prefetchQuery(getListBasesQueryOptions());
  }
}

/** Packaging rules: every item, for the rule's "match item" picker (page and prefetch share it). */
export const packagingItemsParams = (orgId: string | null): ListMenuCatalogParams => ({ org_id: orgId ?? "", per_page: 500 });

type PricingValues = ListValues<typeof pricingSearch.spec>;

/** Pricing & availability, items tab: the catalog page request (page and prefetch share it). */
export function pricingCatalogParams(orgId: string | null, f: PricingValues): ListMenuCatalogParams {
  return { org_id: orgId ?? "", search: f.q || undefined, page: f.page, per_page: PRICING_PAGE_SIZE };
}

/** Pricing & availability, add-ons tab: the add-on catalog page request. */
export function pricingAddonParams(orgId: string | null, f: PricingValues): ListAddonCatalogParams {
  return { org_id: orgId ?? "", search: f.aq || undefined, page: f.apage, per_page: PRICING_PAGE_SIZE };
}

/** Sidebar/palette intent: warm Pricing & availability as the page will open it (needs a branch). */
export function prefetchPricing(qc: QueryClient, { orgId, branchId, search }: PrefetchCtx): void {
  if (!orgId) return;
  void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  if (!branchId) return;
  const f = pricingSearch.entryValues(branchId, search);
  void qc.prefetchQuery(getListMenuCatalogQueryOptions(pricingCatalogParams(orgId, f)));
  void qc.prefetchQuery(getListAddonCatalogQueryOptions(pricingAddonParams(orgId, f)));
  void qc.prefetchQuery(getListBranchAddonOverridesQueryOptions({ branch_id: branchId }));
  for (const channel of PRICING_CHANNELS) {
    void qc.prefetchQuery(getListChannelAddonOverridesQueryOptions({ branch_id: branchId, channel }));
  }
}
