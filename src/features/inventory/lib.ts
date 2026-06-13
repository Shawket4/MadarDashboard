import { queryClient } from "@/data/api/query";

/**
 * Self-contained helpers for the inventory screens. Kept separate from any
 * shared `util.ts` so this module stays internally consistent and correct
 * against the backend enums.
 *
 * Invalidate everything an inventory mutation can touch: catalog/stock/movements/
 * waste/transfers (under `/inventory`), stocktakes, purchasing, and the reports
 * that read those movements (valuation, low-stock, consumption, shrinkage, waste).
 */
export const invalidateInventory = () =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return (
        typeof k === "string" &&
        (k.startsWith("/inventory") ||
          k.startsWith("/stocktakes") ||
          k.startsWith("/purchasing") ||
          k.startsWith("/reports"))
      );
    },
  });

// ── Enums (mirror the backend) ───────────────────────────────────────────────

/** Stock-count variance reasons (StocktakeItem.variance_reason / ItemCountInput). */
export const VARIANCE_REASONS = [
  "theft",
  "spoilage",
  "breakage",
  "miscount",
  "supplier_short",
  "transfer_error",
  "other",
] as const;
export type VarianceReason = (typeof VARIANCE_REASONS)[number];

/** Waste reasons (CreateWasteRequest.reason). */
export const WASTE_REASONS = [
  "expired",
  "spoiled",
  "damaged",
  "overproduction",
  "theft",
  "other",
] as const;
export type WasteReason = (typeof WASTE_REASONS)[number];

/** Purchase-order statuses (PurchaseOrder.status). */
export const PO_STATUSES = [
  "draft",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
] as const;
export type POStatus = (typeof PO_STATUSES)[number];

/** Stock units the catalog supports. */
export const UNITS = ["g", "kg", "ml", "l", "pcs"] as const;
/** Ingredient categories with existing i18n keys (inventory.catalog.cat_*). */
export const CATEGORIES = ["general", "milk", "coffee_bean"] as const;

// ── Measure families (the backend converts only within a family) ─────────────

export type MeasureFamily = "weight" | "volume" | "count";

/** weight: g↔kg · volume: ml↔l · count: pcs (no conversion). */
export const unitFamily = (unit: string): MeasureFamily =>
  unit === "g" || unit === "kg" ? "weight" : unit === "ml" || unit === "l" ? "volume" : "count";

/** The valid units a given unit can change to / be purchased in (same family). */
export const unitsForFamily = (unit: string): string[] => {
  switch (unitFamily(unit)) {
    case "weight":
      return ["g", "kg"];
    case "volume":
      return ["ml", "l"];
    default:
      return ["pcs"];
  }
};

// ── Variance flagging (client-side, mirrors the finalize guardrail) ──────────

/**
 * A counted row is flagged when |counted − expected| is at least the org
 * tolerance percent of the expected quantity, or when stock appears-from /
 * vanishes-to zero. Flagged rows require a `variance_reason` before finalize
 * (the backend returns 409 otherwise). Uncounted rows are never flagged.
 */
export function isVarianceFlagged(
  expected: number,
  counted: number | null | undefined,
  thresholdPct: number,
): boolean {
  if (counted == null) return false;
  if (expected === 0) return counted !== 0; // appears from zero
  if (counted === 0) return true; // vanishes to zero
  return Math.abs(counted - expected) >= (thresholdPct / 100) * Math.abs(expected);
}

/** Tailwind classes for a coloured PO-status badge. */
export const PO_STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ordered: "bg-info/10 text-info",
  partially_received: "bg-warning/10 text-warning",
  received: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Stocktake statuses that are still editable (the backend uses these for an open count). */
export const isOpenStocktake = (status: string): boolean => status === "in_progress" || status === "draft";

/** Tailwind classes for a coloured stocktake-status badge. */
export const STOCKTAKE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  open: "bg-info/10 text-info",
  finalized: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};
