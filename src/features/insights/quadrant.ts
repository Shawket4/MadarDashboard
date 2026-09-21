import type { MarginLedgerRow } from "@/data/api/generated/models";

/** The four Kasavana–Smith classes, in the order the legend lists them. */
export const QUADRANT_CLASSES = ["star", "workhorse", "challenge", "dog"] as const;
export type QuadrantClass = (typeof QUADRANT_CLASSES)[number];

const isQuadrantClass = (c: string | null | undefined): c is QuadrantClass =>
  (QUADRANT_CLASSES as readonly string[]).includes(c ?? "");

export interface QuadrantDot {
  /** Share of tracked units, percent (0–100), unrounded. */
  x: number;
  /** Unit contribution margin, piastres. A chart coordinate, never summed or shown as money. */
  y: number;
  row: MarginLedgerRow;
}

export interface QuadrantModel {
  dots: Record<QuadrantClass, QuadrantDot[]>;
  counts: Record<QuadrantClass, number>;
  /** How many rows are on the chart. */
  plotted: number;
  /** Where the server split low/high popularity: the 70% rule, 70/n percent. */
  popularityThresholdPct: number;
  /** Where the server split low/high profit: weighted-average unit margin, piastres. */
  unitMarginThreshold: number;
}

/**
 * Positions for the menu-engineering quadrant.
 *
 * The CLASS is the server's (`MarginLedgerRow.class`) and is never re-derived
 * here. What the API does not ship is where it drew the two lines, so they are
 * reconstructed with the server's own arithmetic (MadarRust
 * `insights/handlers.rs`): over every row that sold with a known margin,
 * popularity splits at 0.70/n of tracked units and profit at Σmargin/Σunits.
 *
 * That only holds over the WHOLE ledger. Feed this a filtered subset (one
 * class, flagged only) and n, Σunits and Σmargin all change, the lines move,
 * and a server-classed star lands on the dog side of a line it never crossed.
 * Callers pass the unfiltered rows.
 *
 * The x position is likewise taken from the units rather than from
 * `popularity_pct`: that field is rounded to 0.1 for display, and a SKU at
 * 3.44% against a 3.5% line would be drawn at 3.4 or, one unit later, on the
 * line — the dot and its colour must never disagree by a rounding step.
 */
export function quadrantModel(rows: MarginLedgerRow[]): QuadrantModel {
  const dots: QuadrantModel["dots"] = { star: [], workhorse: [], challenge: [], dog: [] };
  const counts: QuadrantModel["counts"] = { star: 0, workhorse: 0, challenge: 0, dog: 0 };

  // The server's classified set: sold, with a known margin. Zero sales would
  // divide by zero; an unknown cost has no margin to place.
  const classified = rows.filter((r) => r.quantity_sold > 0 && r.margin != null);
  let units = 0;
  let margin = 0;
  for (const r of classified) {
    units += r.quantity_sold;
    margin += r.margin ?? 0;
  }

  let plotted = 0;
  for (const r of classified) {
    if (!isQuadrantClass(r.class)) continue;
    dots[r.class].push({
      x: (r.quantity_sold / units) * 100,
      y: (r.margin ?? 0) / r.quantity_sold,
      row: r,
    });
    counts[r.class] += 1;
    plotted += 1;
  }

  return {
    dots,
    counts,
    plotted,
    popularityThresholdPct: classified.length > 0 ? 70 / classified.length : 0,
    unitMarginThreshold: units > 0 ? margin / units : 0,
  };
}
