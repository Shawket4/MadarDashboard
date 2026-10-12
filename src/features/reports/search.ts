import { defineListSearch, param } from "@/data/scope/list-search";

/**
 * Reports list state, in the URL (see data/scope/list-search.ts): the open
 * tab and each report's own filters survive leaving and coming back. The
 * period and branch are the app shell's scope (useScope), not repeated here.
 */

/** Reports ▸ Bundles: combos or deals. */
export const bundlesReportSearch = defineListSearch("/reports/bundles", {
  kind: param.enum(["combo", "deal"] as const, "combo"),
  sort: param.sort(),
  page: param.page(),
});

/**
 * Reports ▸ Financial. `tab` + revenue granularity + the inventory tabs'
 * branch/org scope, and the embedded menu-profitability report's own state
 * (`p*` keys: cost basis, sub-tab, table/quadrant, class, flagged-only, sort, page).
 */
export const financialReportsSearch = defineListSearch("/reports/financial", {
  tab: param.enum(["profitability", "revenue", "channel", "valuation", "supplierSpend", "materialCostTrend"] as const, "profitability", { keepsPage: true }),
  gran: param.enum(["peak_hours", "peak_days", "daily", "monthly"] as const, "daily", { keepsPage: true }),
  inv: param.enum(["branch", "org"] as const, "branch", { keepsPage: true }),
  basis: param.enum(["snapshot", "current"] as const, "snapshot"),
  ptab: param.enum(["ledger", "repricing", "decisions"] as const, "ledger", { keepsPage: true }),
  view: param.enum(["table", "quadrant"] as const, "table", { keepsPage: true }),
  cls: param.enum(["", "star", "workhorse", "challenge", "dog"] as const, ""),
  flagged: param.bool(),
  sort: param.sort(),
  page: param.page(),
});

/** Reports ▸ Legal: which audit tab. */
export const legalReportsSearch = defineListSearch("/reports/legal", {
  tab: param.enum(
    ["tax", "refunds", "voids", "discounts", "waivers", "price_overrides", "manual_deductions", "deduction_overrides", "loyalty_adjustments", "attendance_corrections"] as const,
    "tax",
  ),
});

/** Reports ▸ Loyalty: which tab. */
export const loyaltyReportSearch = defineListSearch("/reports/loyalty", {
  tab: param.enum(["overview", "campaigns", "liability"] as const, "overview"),
});

/** Reports ▸ Operations: which tab. */
export const operationsReportsSearch = defineListSearch("/reports/operations", {
  tab: param.enum(["tables", "overview", "items", "tellers", "waiters", "branches"] as const, "tables"),
});

/** Reports ▸ Tills: tab, the sessions table's search/sort/page, the Sales tab's "show all". */
export const tillsReportSearch = defineListSearch("/reports/tills", {
  tab: param.enum(["sessions", "sales", "timing"] as const, "sessions", { keepsPage: true }),
  q: param.string(),
  sort: param.sort(),
  page: param.page(),
  all: param.bool(false, { keepsPage: true }),
});
