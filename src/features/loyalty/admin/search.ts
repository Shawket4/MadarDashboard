import { defineListSearch, param } from "@/data/scope/list-search";

/** Settings › Loyalty: the open tab in the URL (data/scope/list-search.ts), restored on return. */
export const loyaltySearch = defineListSearch("/settings/loyalty", {
  tab: param.enum(["program", "rewards", "members", "overview"], "program", { keepsPage: true }),
});
