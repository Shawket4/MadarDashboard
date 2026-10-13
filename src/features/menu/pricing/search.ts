import { defineListSearch, param } from "@/data/scope/list-search";

/** Menu › Pricing & availability: tab, searches and pages in the URL (data/scope/list-search.ts). */
export const pricingSearch = defineListSearch("/menu/pricing", {
  tab: param.enum(["items", "addons"], "items", { keepsPage: true }),
  q: param.string(),
  page: param.page(),
  aq: param.string(),
  apage: param.page(),
});
