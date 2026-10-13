import { defineListSearch, param } from "@/data/scope/list-search";

/**
 * Menu › Items list state, in the URL (see data/scope/list-search.ts). The
 * category filter, recipe filter, search and page survive opening an item in
 * the studio and coming back.
 */
export const menuItemsSearch = defineListSearch("/menu/items", {
  tab: param.enum(["items", "addons", "categories"], "items", { keepsPage: true }),
  cat: param.string(),
  recipe: param.enum(["all", "missing", "has"], "all"),
  q: param.string(),
  page: param.page(),
  /** Add-ons tab: group (type), its own search and page. */
  type: param.string(),
  aq: param.string(),
  apage: param.page(),
  /** Categories tab: search. */
  cq: param.string(),
});
