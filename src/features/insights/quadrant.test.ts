import { describe, expect, it } from "vitest";

import type { MarginLedgerRow } from "@/data/api/generated/models";
import { quadrantModel } from "./quadrant";

let n = 0;
const row = (p: Partial<MarginLedgerRow> = {}): MarginLedgerRow => ({
  menu_item_id: `item-${++n}`,
  size_label: "one_size",
  item_name: `Item ${n}`,
  on_menu: true,
  quantity_sold: 10,
  revenue: 10000,
  cost: 4000,
  margin: 6000,
  prev_quantity: 0,
  flags: [],
  class: "star",
  popularity_pct: 0,
  ...p,
});

/** The server's rule (MadarRust insights/handlers.rs), restated as the oracle. */
const serverClass = (rows: MarginLedgerRow[], r: MarginLedgerRow): string => {
  const set = rows.filter((x) => x.quantity_sold > 0 && x.margin != null);
  const units = set.reduce((s, x) => s + x.quantity_sold, 0);
  const margin = set.reduce((s, x) => s + (x.margin ?? 0), 0);
  const popular = r.quantity_sold / units >= 0.7 / set.length;
  const profitable = (r.margin ?? 0) / r.quantity_sold >= margin / units;
  return popular ? (profitable ? "star" : "workhorse") : profitable ? "challenge" : "dog";
};

describe("quadrantModel", () => {
  it("draws the lines where the server split: 70%/n of units, and Σmargin/Σunits", () => {
    const m = quadrantModel([
      row({ quantity_sold: 60, margin: 60 * 500 }),
      row({ quantity_sold: 30, margin: 30 * 200 }),
      row({ quantity_sold: 10, margin: 10 * 900 }),
      row({ quantity_sold: 0, margin: 0, class: null }),
    ]);
    // Four rows, three classified: the unsold one does not dilute n.
    expect(m.popularityThresholdPct).toBeCloseTo(70 / 3);
    expect(m.unitMarginThreshold).toBeCloseTo((30000 + 6000 + 9000) / 100);
    expect(m.plotted).toBe(3);
  });

  it("places every dot on the side of both lines its server class says", () => {
    const rows = [
      row({ quantity_sold: 50, margin: 50 * 700 }),
      row({ quantity_sold: 40, margin: 40 * 100 }),
      row({ quantity_sold: 6, margin: 6 * 900 }),
      row({ quantity_sold: 4, margin: 4 * 50 }),
    ];
    for (const r of rows) r.class = serverClass(rows, r);
    expect(rows.map((r) => r.class)).toEqual(["star", "workhorse", "challenge", "dog"]);

    const m = quadrantModel(rows);
    for (const c of ["star", "workhorse", "challenge", "dog"] as const) {
      for (const d of m.dots[c]) {
        expect(d.x >= m.popularityThresholdPct).toBe(c === "star" || c === "workhorse");
        expect(d.y >= m.unitMarginThreshold).toBe(c === "star" || c === "challenge");
      }
    }
  });

  it("puts a tie exactly ON the line on the high side, as the server's >= does", () => {
    // Two identical items: each holds 50% of units (threshold 35%) and the
    // average unit margin exactly — both are stars, neither is below a line.
    const rows = [row({ quantity_sold: 10, margin: 1000 }), row({ quantity_sold: 10, margin: 1000 })];
    for (const r of rows) r.class = serverClass(rows, r);
    const m = quadrantModel(rows);
    expect(m.counts.star).toBe(2);
    expect(m.dots.star[0].y).toBe(m.unitMarginThreshold);
  });

  it("leaves out what the server could not classify: no sales, or no cost", () => {
    const m = quadrantModel([
      row({ class: "star" }),
      row({ quantity_sold: 0, margin: 0, class: null, popularity_pct: null }),
      row({ cost: null, margin: null, class: null, popularity_pct: null }),
    ]);
    expect(m.plotted).toBe(1);
    // …and an unknown-cost row's units do not move the popularity axis either.
    expect(m.dots.star[0].x).toBe(100);
  });

  it("keeps a loss-making item on the chart, below zero", () => {
    const rows = [row({ quantity_sold: 10, margin: -2000 }), row({ quantity_sold: 10, margin: 6000 })];
    for (const r of rows) r.class = serverClass(rows, r);
    const m = quadrantModel(rows);
    expect(m.dots.workhorse[0].y).toBe(-200);
  });

  it("ignores a class it does not know rather than inventing a quadrant", () => {
    const m = quadrantModel([row({ class: "puzzle" })]);
    expect(m.plotted).toBe(0);
  });

  it("has nothing to draw for an empty ledger, and divides by nothing", () => {
    const m = quadrantModel([]);
    expect(m).toMatchObject({ plotted: 0, popularityThresholdPct: 0, unitMarginThreshold: 0 });
  });

  it("would misdraw the lines from a filtered subset — which is why callers pass the whole ledger", () => {
    const rows = [
      row({ quantity_sold: 50, margin: 50 * 700 }),
      row({ quantity_sold: 40, margin: 40 * 100 }),
      row({ quantity_sold: 6, margin: 6 * 900 }),
      row({ quantity_sold: 4, margin: 4 * 50 }),
    ];
    for (const r of rows) r.class = serverClass(rows, r);
    const whole = quadrantModel(rows);
    const starsOnly = quadrantModel(rows.filter((r) => r.class === "star"));
    expect(starsOnly.popularityThresholdPct).not.toBeCloseTo(whole.popularityThresholdPct);
  });
});
