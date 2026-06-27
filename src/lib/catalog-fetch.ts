import type { QueryClient } from "@tanstack/react-query";

import {
  getListAddonCatalogQueryOptions,
  getListMenuCatalogQueryOptions,
} from "@/data/api/generated/api";
import type {
  AddonItem,
  ListAddonCatalogParams,
  ListMenuCatalogParams,
  MenuItemWithCosts,
} from "@/data/api/generated/models";

/** Backend's max page size for the catalog endpoints (see ListMenuCatalogParams). */
const PER_PAGE = 500;

/**
 * Fetch EVERY page of the menu catalog for the given params, used by exports that
 * need names/org prices for the full set (the on-screen lists are paginated).
 * Resolves through the React Query cache so repeated exports are cheap.
 */
export async function fetchAllMenuCatalog(
  qc: QueryClient,
  params: Omit<ListMenuCatalogParams, "page" | "per_page">,
): Promise<MenuItemWithCosts[]> {
  const out: MenuItemWithCosts[] = [];
  let page = 1;
  for (;;) {
    const res = await qc.fetchQuery(getListMenuCatalogQueryOptions({ ...params, page, per_page: PER_PAGE }));
    out.push(...(res.data ?? []));
    if (page >= (res.total_pages ?? 1) || (res.data?.length ?? 0) === 0) break;
    page += 1;
  }
  return out;
}

/** Add-on counterpart of {@link fetchAllMenuCatalog}. */
export async function fetchAllAddonCatalog(
  qc: QueryClient,
  params: Omit<ListAddonCatalogParams, "page" | "per_page">,
): Promise<AddonItem[]> {
  const out: AddonItem[] = [];
  let page = 1;
  for (;;) {
    const res = await qc.fetchQuery(getListAddonCatalogQueryOptions({ ...params, page, per_page: PER_PAGE }));
    out.push(...(res.data ?? []));
    if (page >= (res.total_pages ?? 1) || (res.data?.length ?? 0) === 0) break;
    page += 1;
  }
  return out;
}
