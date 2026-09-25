/**
 * Reading combos and deals off an order's lines (§3.2), for the order sheet.
 *
 * A sold combo is one header line (`line_kind = "combo"`, no money) and its
 * parts (`combo_part`, each pointing at the header through `combo_line_id`).
 * The parts carry the money: `line_total = combo_share + combo_surcharge`,
 * plus their own add-ons. So the header's figure is the parts' sum, and
 * nothing here double counts.
 *
 * A deal comes off plain lines (`deal_minor`), and those totals are already
 * net — like the staff comp, the sheet only ADDS the cut back for one line so
 * the subtotal adds up from the prices shown.
 */
import type { ComboLineFields, OrderDeal } from "./types";

type Line = { id: string; line_total: number; addons?: { line_total: number }[] } & ComboLineFields;

export type OrderRow<T extends Line> =
  | { kind: "combo"; line: T; parts: T[]; total: number }
  | { kind: "line"; line: T; part: boolean };

/** What a line (with its add-ons) rang at. */
const lineWithAddons = (l: Line): number => l.line_total + (l.addons ?? []).reduce((s, a) => s + a.line_total, 0);

/**
 * The lines in the order to show them: each combo header followed by its
 * parts (in the server's slot order), everything else as it came. A part whose
 * header is missing still shows, as a plain line — money is never hidden.
 */
export function orderRows<T extends Line>(items: T[]): OrderRow<T>[] {
  const partsOf = new Map<string, T[]>();
  const headers = new Set(items.filter((l) => l.line_kind === "combo").map((l) => l.id));
  for (const l of items) {
    if (l.line_kind === "combo_part" && l.combo_line_id && headers.has(l.combo_line_id)) {
      (partsOf.get(l.combo_line_id) ?? partsOf.set(l.combo_line_id, []).get(l.combo_line_id)!).push(l);
    }
  }
  const out: OrderRow<T>[] = [];
  for (const l of items) {
    if (l.line_kind === "combo") {
      const parts = partsOf.get(l.id) ?? [];
      out.push({ kind: "combo", line: l, parts, total: parts.reduce((s, p) => s + lineWithAddons(p), 0) });
      for (const p of parts) out.push({ kind: "line", line: p, part: true });
    } else if (!(l.line_kind === "combo_part" && l.combo_line_id && headers.has(l.combo_line_id))) {
      out.push({ kind: "line", line: l, part: false });
    }
  }
  return out;
}

/** Everything the order's deals took off, already out of every stored total. */
export const orderDealsTotal = (deals: OrderDeal[] | null | undefined): number =>
  (deals ?? []).reduce((s, d) => s + Math.max(0, d.discount), 0);

/** The deals on an order, read leniently: an older server sends none. */
export const dealsOf = (order: unknown): OrderDeal[] => {
  const d = (order as { deals?: unknown } | null | undefined)?.deals;
  return Array.isArray(d) ? (d as OrderDeal[]) : [];
};
