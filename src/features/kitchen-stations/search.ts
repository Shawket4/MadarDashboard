import { defineListSearch, param } from "@/data/scope/list-search";

/** Settings › Kitchen routing: tab, item search and page in the URL (data/scope/list-search.ts). */
export const kitchenRoutingSearch = defineListSearch("/settings/kitchen-routing", {
  tab: param.enum(["categories", "items"], "categories", { keepsPage: true }),
  q: param.string(),
  page: param.page(),
});

/** Settings › Kitchen stations: the table's search and page. */
export const kitchenStationsSearch = defineListSearch("/settings/kitchen-stations", {
  q: param.string(),
  page: param.page(),
});

/** Items tab page size. */
export const ROUTING_PER_PAGE = 50;

/** The items tab's catalog read: one builder for the page and its prefetch, so both use one key. */
export const routingCatalogParams = (orgId: string | null, f: { q: string; page: number }) => ({
  org_id: orgId ?? "",
  search: f.q || undefined,
  page: f.page,
  per_page: ROUTING_PER_PAGE,
});
