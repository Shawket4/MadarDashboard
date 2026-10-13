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
