import type { StatusTone } from "@/components/app/status-pill";
import { Cap, type Capability } from "@/generated/capabilities";
import { queryClient } from "@/data/api/query";
import type { BranchStockRow, ItemCountInput, StockTransfer, Stocktake, StocktakeItem } from "@/data/api/generated/models";
import { fmtNumber } from "@/lib/format";

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
// madar-units (`unit_spec`, `units_of`, `convert`), pinned by
// src/lib/unit_vectors.json; no density bridge here.

export type MeasureFamily = "weight" | "volume" | "count";

/** A unit's family and its factor to the family's smallest unit; case and
 *  surrounding spaces ignored, anything else unknown. */
const UNIT_SPECS = new Map<string, [MeasureFamily, number]>([
  ["g", ["weight", 1]],
  ["kg", ["weight", 1000]],
  ["ml", ["volume", 1]],
  ["l", ["volume", 1000]],
  ["pcs", ["count", 1]],
]);
const unitSpec = (unit: string) => UNIT_SPECS.get(unit.trim().toLowerCase());

/** `null` for a unit the backend doesn't know. */
export const unitFamily = (unit: string): MeasureFamily | null => unitSpec(unit)?.[0] ?? null;

/** The units something stocked in `unit` may be typed in (an unknown unit only in itself). */
export const unitsForFamily = (unit: string): string[] => {
  switch (unitFamily(unit)) {
    case "weight":
      return ["g", "kg"];
    case "volume":
      return ["ml", "l"];
    case "count":
      return ["pcs"];
    default:
      return [unit];
  }
};

// ── Purchase costs: the invoice total is the truth ───────────────────────────

/** Base stock units in one purchase unit (a kg of a gram item → 1000), the
 *  same conversion the backend derives the pack factor with. `null` where the
 *  backend refuses to convert: an unknown unit, or across families. */
export const stockUnitsPer = (purchaseUnit: string, stockUnit: string): number | null => {
  const from = unitSpec(purchaseUnit);
  const to = unitSpec(stockUnit);
  return from && to && from[0] === to[0] ? from[1] / to[1] : null;
};

/** A line's unit cost DERIVED from its total, in piastres per purchase unit,
 *  unrounded. `null` until both are known. Never the other way round: a unit
 *  cost rounded to whole piastres turned 12 000 g at 548.16 EGP into 600.00. */
export const unitCostFromTotal = (linePiastres: number, qty: number): number | null =>
  Number.isFinite(linePiastres) && linePiastres >= 0 && Number.isFinite(qty) && qty > 0
    ? linePiastres / qty
    : null;

/** The catalog's estimate of a line's total, in whole piastres: its cost per
 *  stock unit × the stock units ordered. `null` when the catalog has no cost
 *  or the units don't convert (no figure rather than a wrong one). */
export const estimateLineTotal = (
  catalogCostPerStockUnit: number | null | undefined,
  qty: number,
  purchaseUnit: string,
  stockUnit: string,
): number | null => {
  const per = stockUnitsPer(purchaseUnit, stockUnit);
  return catalogCostPerStockUnit != null && per != null && Number.isFinite(qty) && qty > 0
    ? Math.round(catalogCostPerStockUnit * qty * per)
    : null;
};

/** Fraction digits a unit cost is shown with (EGP), always all of them:
 *  enough for 0.04568 per gram, and a whole-looking figure still reads as
 *  the exact quotient it is (0.050000, not a rounded-looking 0.05). */
export const UNIT_COST_DIGITS = 6;

/** A unit cost in EGP, from piastres per unit, at a fixed [UNIT_COST_DIGITS]. */
export const formatUnitCost = (piastresPerUnit: number): string =>
  fmtNumber(piastresPerUnit / 100, {
    minimumFractionDigits: UNIT_COST_DIGITS,
    maximumFractionDigits: UNIT_COST_DIGITS,
  });

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

/**
 * Where a waste log line came from: the till (`pos`), the dashboard, a refunded
 * sale (`refund`: the food was served, so its stock stays deducted and counts
 * as waste), or a made order voided before voids always restocked (`order`).
 * Older backends send no source: a line tied to an order is a void, anything
 * else was entered here.
 */
export type WasteSource = "pos" | "dashboard" | "refund" | "order";

export function wasteSource(m: {
  waste_source?: string | null;
  source_type?: string | null;
}): WasteSource {
  if (
    m.waste_source === "pos" ||
    m.waste_source === "order" ||
    m.waste_source === "refund" ||
    m.waste_source === "dashboard"
  ) {
    return m.waste_source;
  }
  if (m.source_type === "refund") return "refund";
  return m.source_type === "order" ? "order" : "dashboard";
}

/** When it happened: on the device for a till's queued waste, else when it was posted. */
export function wasteWhen(m: { occurred_at?: string | null; created_at: string }): string {
  return m.occurred_at ?? m.created_at;
}

/**
 * A queued waste reaches the server later than it happened. The log shows the
 * receive time as secondary info only when the gap is meaningful: more than
 * {@link RECEIVED_LATE_MS} (5 minutes) either way. Null otherwise.
 */
export const RECEIVED_LATE_MS = 5 * 60 * 1000;

export function wasteReceivedLate(m: {
  occurred_at?: string | null;
  received_at?: string | null;
  created_at: string;
}): string | null {
  const received = m.received_at ?? m.created_at;
  if (!m.occurred_at) return null;
  const gap = Math.abs(Date.parse(received) - Date.parse(m.occurred_at));
  return Number.isFinite(gap) && gap > RECEIVED_LATE_MS ? received : null;
}

/** Stock below zero is allowed (a till that was offline could not know), and always shown as such. */
export function isBelowZero(onHand: number | null | undefined): boolean {
  return onHand != null && Number.isFinite(onHand) && onHand < 0;
}

// ── Transfers (WAREHOUSE_DESIGN.md) ──────────────────────────────────────────

export type TransferAction = "edit" | "accept" | "decline" | "dispatch" | "receive" | "cancel";
type Side = "source" | "destination";

/**
 * Which side may take which action in which status — the backend's table
 * (madar_inventory::transfer::step), mirrored so the drawer offers only what
 * the server would allow. The server still decides.
 */
const TRANSFER_STEPS: Record<string, Partial<Record<TransferAction, Side>>> = {
  requested: { edit: "destination", cancel: "destination", accept: "source", decline: "source" },
  draft: { edit: "source", dispatch: "source", cancel: "source" },
  dispatched: { receive: "destination", cancel: "source" },
};

/** The capability each action needs (the same table's third column). */
const TRANSFER_CAPS = (status: string, a: TransferAction): Capability =>
  a === "receive" ? Cap.inventoryTransfersEdit
    : a === "cancel" && status === "dispatched" ? Cap.inventoryTransfersDelete
    : Cap.inventoryTransfersCreate;

/** One cell of the table: who acts and what they need, or null when the action is closed. */
export function transferStep(status: string, a: TransferAction): { side: Side; cap: Capability } | null {
  const side = TRANSFER_STEPS[status]?.[a];
  return side ? { side, cap: TRANSFER_CAPS(status, a) } : null;
}

/**
 * Actions open to someone who works at `myBranches` (owners: every location)
 * and holds the capability AT the acting side's location (`can(cap, at)`),
 * which is where the server checks it.
 */
export function transferActions(
  t: Pick<StockTransfer, "status" | "source_branch_id" | "destination_branch_id">,
  myBranches: Set<string>,
  can: (cap: Capability, at: string) => boolean = () => true,
): TransferAction[] {
  return (Object.keys(TRANSFER_STEPS[t.status] ?? {}) as TransferAction[]).filter((a) => {
    const step = transferStep(t.status, a);
    if (!step) return false;
    const at = step.side === "source" ? t.source_branch_id : t.destination_branch_id;
    return myBranches.has(at) && can(step.cap, at);
  });
}

/** A quantity in whole thousandths, as the server compares them (madar_inventory::milli). */
export const milli = (q: number): number => Math.sign(q) * Math.round(Math.abs(q) * 1000);

export type Arrival = "exact" | "short" | "over";

/**
 * One received line, judged as the server judges it
 * (madar_inventory::transfer::check_receive_line): in whole thousandths; more
 * than was sent needs a note; `difference` = received − sent.
 */
export function checkReceiveLine(
  sent: number,
  got: number,
  note: string | null | undefined,
): { arrival: Arrival; difference: number } | { refused: "negative" | "over_needs_note" } {
  const [s, g] = [milli(sent), milli(got)];
  if (g < 0) return { refused: "negative" };
  if (g > s && !(note ?? "").trim()) return { refused: "over_needs_note" };
  return { arrival: g === s ? "exact" : g < s ? "short" : "over", difference: (g - s) / 1000 };
}

export const TRANSFER_TONES: Record<string, StatusTone> = {
  requested: "info",
  draft: "neutral",
  dispatched: "accent",
  received: "success",
  cancelled: "danger",
};
