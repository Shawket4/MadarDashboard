import { defineListSearch, param } from "@/data/scope/list-search";

/** Menu › Deals: the table's page in the URL (data/scope/list-search.ts), restored on return. */
export const dealsSearch = defineListSearch("/menu/deals", {
  page: param.page(),
});
