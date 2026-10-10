import type { StatusTone } from "@/components/app/status-pill";
import type { Capability } from "@/generated/capabilities";
import { queryClient } from "@/data/api/query";
import type { BranchStockRow, ItemCountInput, StockTransfer, Stocktake, StocktakeItem } from "@/data/api/generated/models";
import { fmtNumber } from "@/lib/format";
import { rules, type Action, type LineCheck, type ReceiveRefusal, type Side, type TransferStatus } from "@/lib/rules";

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

// ── Units, purchase costs, counts, transfers: madar-shared's Rust ────────────
// The rules below are madar-units and madar-inventory through WebAssembly
// (`@/lib/rules`), the code the backend runs; lib.test.ts runs them against
// the pinned unit_vectors.json and inventory_vectors.json.

/** The units something stocked in `unit` may be typed in (an unknown unit only in itself). */
export const unitsForFamily = (unit: string): string[] => rules.units_of(unit);

/** A line's unit cost DERIVED from its total, in piastres per purchase unit
 *  (8 dp, on the quantity rounded to 3 dp half away from zero, as the server
 *  stores it). `null` until both are known. Never the other way round: a unit
 *  cost rounded to whole piastres turned 12 000 g at 548.16 EGP into 600.00. */
export const unitCostFromTotal = (linePiastres: number, qty: number): number | null =>
  Number.isInteger(linePiastres) ? rules.unit_cost_from_total(linePiastres, qty) : null;

/** The catalog's estimate of a line's total, in whole piastres: its cost per
 *  stock unit × the stock units ordered, exact and rounded once. `null` when
 *  the catalog has no cost or the units don't convert (no figure rather than a
 *  wrong one). */
export const estimateLineTotal = (
  catalogCostPerStockUnit: number | null | undefined,
  qty: number,
  purchaseUnit: string,
  stockUnit: string,
): number | null => rules.estimate_line_total(catalogCostPerStockUnit, qty, purchaseUnit, stockUnit);

/** What a delivery of `received` costs, in piastres, not rounded (madar-inventory
 *  `delivery_cost`, the server's sum): the invoice total if given, else the unit
 *  price × the quantity, else the ordered line total pro rata. `null` when the
 *  server would refuse it (a negative cost). */
export const deliveryCost = (
  received: number,
  lineCost: number | null,
  unitCost: number | null,
  orderedLineCost: number,
  quantityOrdered: number,
): number | null => {
  const c = rules.delivery_cost(received, lineCost, unitCost, orderedLineCost, quantityOrdered);
  return typeof c === "number" ? c : null;
};

/** A quantity at the 3 dp grain the ledger stores (madar-inventory `quantity_dec`: read as printed, half away from zero). */
export const roundQty = (q: number): number => rules.quantity_dec(q);

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
 * percent of book stock (exact, in thousandths), or when stock appears from
 * zero. Flagged rows need a `variance_reason` before finalize (the backend runs
 * the same rule against the same live book figure and answers 409 otherwise).
 */
export const isVarianceFlagged = (book: number, counted: number | null | undefined, thresholdPct: number): boolean =>
  counted != null && rules.is_variance_flagged(book, counted, thresholdPct);

/** Parse a count input; empty or non-numeric means "not counted". */
export function parseCount(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * The `PUT /stocktakes/{id}/items` payload from the editor's local state: one
 * entry per row that has a count, carrying its reason when one was picked.
 * Rows outside the snapshot (found items) are included the same way. A row
 * cleared on screen that the server still holds a figure for (`held`) is sent
 * as `counted_qty: null`, which un-counts it, so finalize agrees with the screen.
 */
export function buildCountPayload(
  rowIds: string[],
  counts: Record<string, string>,
  reasons: Record<string, string>,
  held: ReadonlySet<string> = new Set(),
): ItemCountInput[] {
  const out: ItemCountInput[] = [];
  for (const id of rowIds) {
    const qty = parseCount(counts[id]);
    if (qty != null) out.push({ org_ingredient_id: id, counted_qty: qty, variance_reason: reasons[id] || null });
    else if (held.has(id)) out.push({ org_ingredient_id: id, counted_qty: null });
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

export type TransferAction = Action;
const TRANSFER_ACTIONS: TransferAction[] = ["edit", "accept", "decline", "dispatch", "receive", "cancel"];
const TRANSFER_STATUSES: string[] = ["requested", "draft", "dispatched", "received", "cancelled"] satisfies TransferStatus[];

/**
 * Which side may take an action in a status, and the capability it needs
 * (madar_inventory::transfer::step), so the drawer offers only what the server
 * would allow; null when the action is closed. The server still decides.
 */
export const transferStep = (status: string, a: TransferAction): { side: Side; cap: Capability } | null =>
  // A status this build does not know opens nothing (the wasm throws on it).
  TRANSFER_STATUSES.includes(status)
    ? (rules.transfer_step(status as TransferStatus, a) as { side: Side; cap: Capability } | null)
    : null;

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
  return TRANSFER_ACTIONS.filter((a) => {
    const step = transferStep(t.status, a);
    if (!step) return false;
    const at = step.side === "source" ? t.source_branch_id : t.destination_branch_id;
    return myBranches.has(at) && can(step.cap, at);
  });
}

/**
 * One received line, judged as the server judges it
 * (madar_inventory::transfer::check_receive_line): in whole thousandths; more
 * than was sent needs a note; `difference` = received − sent.
 */
export function checkReceiveLine(
  sent: number,
  got: number,
  note: string | null | undefined,
): LineCheck | { refused: ReceiveRefusal } {
  const r = rules.check_receive_line(sent, got, note);
  return typeof r === "string" ? { refused: r } : r;
}

export const TRANSFER_TONES: Record<string, StatusTone> = {
  requested: "info",
  draft: "neutral",
  dispatched: "accent",
  received: "success",
  cancelled: "danger",
};
