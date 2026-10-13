import { defineListSearch, param } from "@/data/scope/list-search";

/**
 * Inventory list state, in the URL (see data/scope/list-search.ts): tabs,
 * filters, search, sort and page survive leaving the page and coming back.
 * The branch and period are the app shell's scope (useScope), not repeated here.
 */

/** Ingredients: low/uncounted filter + the table's search, sort and page. */
export const ingredientsSearch = defineListSearch("/inventory/ingredients", {
  filter: param.enum(["all", "low", "uncounted"] as const, "all"),
  q: param.string(),
  sort: param.sort(),
  page: param.page(),
});

/** Stock counts: the open count's search / category / status filter, and the history table. */
export const countsSearch = defineListSearch("/inventory/counts", {
  cq: param.string(),
  ccat: param.string(),
  cfilter: param.enum(["all", "uncounted", "counted", "flagged"] as const, "all"),
  sort: param.sort(),
  page: param.page(),
});

/** Purchasing: tab, PO status filter, both tables' sort/page, supplier search. */
export const purchasingSearch = defineListSearch("/inventory/purchasing", {
  tab: param.enum(["orders", "suppliers", "reorder"] as const, "orders", { keepsPage: true }),
  // Mirrors lib.ts PO_STATUSES (kept literal: route files load eagerly).
  status: param.enum(["all", "draft", "ordered", "partially_received", "received", "cancelled"] as const, "all"),
  sort: param.sort(),
  page: param.page(),
  sq: param.string(),
  ssort: param.sort(),
  spage: param.page(),
});

/** Transfers: status tab, direction, sort and page. */
export const transfersSearch = defineListSearch("/inventory/transfers", {
  tab: param.enum(["all", "requested", "draft", "dispatched", "received", "cancelled", "differences"] as const, "all"),
  dir: param.enum(["all", "incoming", "outgoing"] as const, "all"),
  sort: param.sort(),
  page: param.page(),
});

/** Waste log: search, sort, page. */
export const wasteSearch = defineListSearch("/inventory/waste", {
  q: param.string(),
  sort: param.sort(),
  page: param.page(),
});

/** Today: the low-stock table's page. */
export const todaySearch = defineListSearch("/inventory/today", {
  page: param.page(),
});

/** Reports ▸ Inventory: tab + this-branch / whole-org scope. */
export const inventoryReportsSearch = defineListSearch("/reports/inventory", {
  tab: param.enum(["consumption", "shrinkage", "waste", "poLeadTime", "lowStock"] as const, "consumption"),
  scope: param.enum(["branch", "org"] as const, "branch"),
});
