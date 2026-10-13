import { defineListSearch, param } from "@/data/scope/list-search";

/** Settings › Payment methods: the tab and the table's search and page in the URL (data/scope/list-search.ts), restored on return. */
export const paymentMethodsSearch = defineListSearch("/settings/payment-methods", {
  tab: param.enum(["methods", "availability"], "methods", { keepsPage: true }),
  q: param.string(),
  page: param.page(),
});
