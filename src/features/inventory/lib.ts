import type { StatusTone } from "@/components/app/status-pill";
import { queryClient } from "@/data/api/query";
import type { BranchStockRow, ItemCountInput, Stocktake, StocktakeItem } from "@/data/api/generated/models";

/**
 * Shared vocabulary + helpers for the inventory screens.
 *
 * Model (inventory v2): the org catalog is the only setup. Every branch sees the
 * whole catalog; a row with `has_activity = false` has simply never moved or
 * been counted there. Stock only changes through the ledger — the dashboard
 * never writes an on-hand figure, it counts, wastes, transfers or receives.
 */

/** Invalidate everything an inventory mutation can touch. */
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

export const WASTE_REASONS = ["expired", "spoiled", "damaged", "overproduction", "theft", "other"] as const;
export type WasteReason = (typeof WASTE_REASONS)[number];

export const PO_STATUSES = ["draft", "ordered", "partially_received", "received", "cancelled"] as const;
export type POStatus = (typeof PO_STATUSES)[number];

/** Stock units the catalog supports. */
export const UNITS = ["g", "kg", "ml", "l", "pcs"] as const;

// ── Measure families (the backend converts only within a family) ─────────────

export type MeasureFamily = "weight" | "volume" | "count";

export const unitFamily = (unit: string): MeasureFamily =>
  unit === "g" || unit === "kg" ? "weight" : unit === "ml" || unit === "l" ? "volume" : "count";

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

// ── Stock counts ─────────────────────────────────────────────────────────────

/**
 * A counted row is flagged when |counted − book| is at least the org tolerance
 * percent of book stock, or when stock appears-from / vanishes-to zero.
 * Flagged rows need a `variance_reason` before finalize (the backend enforces
 * the same rule against the same live book figure and answers 409 otherwise).
 */
export function isVarianceFlagged(book: number, counted: number | null | undefined, thresholdPct: number): boolean {
  if (counted == null) return false;
  if (Math.abs(book) < 1e-9) return Math.abs(counted) > 1e-9;
  return (Math.abs(counted - book) / Math.abs(book)) * 100 >= thresholdPct;
}

/** Parse a count input; empty or non-numeric means "not counted". */
export function parseCount(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * The `PUT /stocktakes/{id}/items` payload from the editor's local state: one
 * entry per row that has a count, carrying its reason when one was picked.
 * Rows outside the snapshot (found items) are included the same way.
 */
export function buildCountPayload(
  rowIds: string[],
  counts: Record<string, string>,
  reasons: Record<string, string>,
): ItemCountInput[] {
  const out: ItemCountInput[] = [];
  for (const id of rowIds) {
    const qty = parseCount(counts[id]);
    if (qty == null) continue;
    out.push({ org_ingredient_id: id, counted_qty: qty, variance_reason: reasons[id] || null });
  }
  return out;
}

/** Names of counted rows that are flagged but carry no reason yet. */
export function missingReasons(
  items: Pick<StocktakeItem, "org_ingredient_id" | "ingredient_name" | "book_qty">[],
  counts: Record<string, string>,
  reasons: Record<string, string>,
  thresholdPct: number,
): string[] {
  return items
    .filter((it) => {
      const counted = parseCount(counts[it.org_ingredient_id]);
      return counted != null && isVarianceFlagged(it.book_qty, counted, thresholdPct) && !reasons[it.org_ingredient_id];
    })
    .map((it) => it.ingredient_name);
}

export const isOpenStocktake = (status: string): boolean => status === "in_progress" || status === "draft";

/** True when the branch has never finalized a count — the first-run entrance. */
export function needsFirstCount(stocktakes: Pick<Stocktake, "status">[] | undefined): boolean {
  if (!stocktakes) return false;
  return !stocktakes.some((s) => s.status === "finalized");
}

export const COUNT_DUE_DAYS = 14;

/** Catalog rows a branch should count: never counted, or older than the window. */
export function countsDue(rows: Pick<BranchStockRow, "last_counted_at">[], now = Date.now()): number {
  const window = COUNT_DUE_DAYS * 86_400_000;
  return rows.filter((r) => r.last_counted_at == null || now - new Date(r.last_counted_at).getTime() > window).length;
}

// ── Badge styles ─────────────────────────────────────────────────────────────

export const PO_STATUS_TONES: Record<string, StatusTone> = {
  draft: "neutral",
  ordered: "accent",
  partially_received: "warning",
  received: "success",
  cancelled: "danger",
};

export const STOCKTAKE_STATUS_TONES: Record<string, StatusTone> = {
  draft: "neutral",
  in_progress: "accent",
  finalized: "success",
  cancelled: "danger",
};
