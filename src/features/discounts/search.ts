import { defineListSearch, param } from "@/data/scope/list-search";

/** Discounts: the table's search and page in the URL (data/scope/list-search.ts), restored on return. */
export const discountsSearch = defineListSearch("/discounts", {
  q: param.string(),
  page: param.page(),
});
