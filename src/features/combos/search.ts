import { defineListSearch, param } from "@/data/scope/list-search";

/** Menu › Combos list state in the URL (data/scope/list-search.ts): restored on return from the editor. */
export const combosSearch = defineListSearch("/menu/combos", {
  q: param.string(),
  cat: param.string(),
  status: param.enum(["all", "active", "inactive"], "all"),
  page: param.page(),
});
