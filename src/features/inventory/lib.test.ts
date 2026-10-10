import countVectors from "@/lib/count_vectors.json";
import vectors from "@/lib/inventory_vectors.json";
import purchase from "@/lib/purchase_vectors.json";
import unitVectors from "@/lib/unit_vectors.json";
import { describe, expect, it } from "vitest";

import { rules } from "@/lib/rules";
import {
  formatUnitCost,
  estimateLineTotal,
  unitsForFamily,
  unitCostFromTotal,
  buildCountPayload,
  checkReceiveLine,
  transferActions,
  transferStep,
  countsDue,
  deliveryCost,
  isVarianceFlagged,
  missingReasons,
  needsFirstCount,
  parseCount,
  roundQty,
  isBelowZero,
  wasteReceivedLate,
  wasteSource,
  wasteWhen,
} from "./lib";

/**
 * The count editor gates "Review & finalize" on the same rule the backend
 * enforces (409 otherwise), measured against BOOK stock — never the opening
 * snapshot, or a sale during a long count would read as shrinkage.
 */
describe("isVarianceFlagged", () => {
  it("flags a difference at or above the tolerance of book stock", () => {
    expect(isVarianceFlagged(100, 90, 10)).toBe(true);
    expect(isVarianceFlagged(100, 91, 10)).toBe(false);
    expect(isVarianceFlagged(100, 110, 10)).toBe(true);
  });

  it("flags stock that appears from zero and never flags an uncounted row", () => {
    expect(isVarianceFlagged(0, 3, 10)).toBe(true);
    expect(isVarianceFlagged(0, 0, 10)).toBe(false);
    expect(isVarianceFlagged(100, null, 10)).toBe(false);
  });

  it("compares exactly, in thousandths (D1: 1 counted as 0.9 at 10 % is flagged)", () => {
    expect(isVarianceFlagged(1, 0.9, 10)).toBe(true);
    expect(isVarianceFlagged(1, 0.9001, 10)).toBe(true); // 0.900 at the 3 dp grain
    expect(isVarianceFlagged(1, 0.901, 10)).toBe(false);
  });
});

describe("buildCountPayload", () => {
  it("sends only counted rows, with their reason when one was picked", () => {
    const payload = buildCountPayload(["a", "b", "c"], { a: "12", b: "", c: "abc" }, { a: "miscount" });
    expect(payload).toEqual([{ org_ingredient_id: "a", counted_qty: 12, variance_reason: "miscount" }]);
  });

  it("un-counts a cleared row the server holds a figure for, and only that row (W9, B2)", () => {
    const payload = buildCountPayload(["a", "b", "c"], { a: "", b: "", c: "4" }, { a: "theft" }, new Set(["a", "c"]));
    expect(payload).toEqual([
      { org_ingredient_id: "a", counted_qty: null },
      { org_ingredient_id: "c", counted_qty: 4, variance_reason: null },
    ]);
  });

  it("treats a blank reason as none", () => {
    expect(buildCountPayload(["a"], { a: "0" }, { a: "" })[0].variance_reason).toBeNull();
    expect(parseCount(" ")).toBeNull();
  });
});

describe("missingReasons", () => {
  const items = [
    { org_ingredient_id: "milk", ingredient_name: "Milk", book_qty: 100 },
    { org_ingredient_id: "new", ingredient_name: "New item", book_qty: 0 },
  ];

  it("names flagged rows without a reason, ignoring small differences", () => {
    expect(missingReasons(items, { milk: "50", new: "0" }, {}, 10)).toEqual(["Milk"]);
    expect(missingReasons(items, { milk: "95", new: "4" }, {}, 10)).toEqual(["New item"]);
    expect(missingReasons(items, { milk: "50", new: "4" }, { milk: "theft", new: "miscount" }, 10)).toEqual([]);
  });
});

describe("first-run and counts due", () => {
  it("treats a branch with no finalized count as needing its first count", () => {
    expect(needsFirstCount([])).toBe(true);
    expect(needsFirstCount([{ status: "in_progress" }])).toBe(true);
    expect(needsFirstCount([{ status: "finalized" }, { status: "cancelled" }])).toBe(false);
    expect(needsFirstCount(undefined)).toBe(false);
  });

  it("counts never-counted and stale rows across the whole catalog", () => {
    const now = Date.parse("2026-09-05T12:00:00Z");
    const rows = [
      { last_counted_at: null },
      { last_counted_at: "2026-09-01T00:00:00Z" },
      { last_counted_at: "2026-08-01T00:00:00Z" },
    ];
    expect(countsDue(rows, now)).toBe(2);
  });
});

describe("waste log source", () => {
  it("reads the server's source, and falls back for an older backend", () => {
    expect(wasteSource({ waste_source: "pos" })).toBe("pos");
    expect(wasteSource({ waste_source: null, source_type: "order" })).toBe("order");
    expect(wasteSource({ source_type: "waste" })).toBe("dashboard");
    expect(wasteSource({ waste_source: "refund" })).toBe("refund");
    expect(wasteSource({ waste_source: null, source_type: "refund" })).toBe("refund");
  });

  it("dates a queued till waste by when it happened on the device", () => {
    expect(wasteWhen({ occurred_at: "2026-09-17T08:00:00Z", created_at: "2026-09-17T10:00:00Z" })).toBe(
      "2026-09-17T08:00:00Z",
    );
    expect(wasteWhen({ occurred_at: null, created_at: "2026-09-17T10:00:00Z" })).toBe("2026-09-17T10:00:00Z");
  });
});

describe("waste log receive time", () => {
  it("shows when the server received it only past five minutes", () => {
    const occurred = "2026-09-17T08:00:00Z";
    expect(wasteReceivedLate({ occurred_at: occurred, received_at: "2026-09-17T08:04:59Z", created_at: "x" })).toBeNull();
    expect(wasteReceivedLate({ occurred_at: occurred, received_at: "2026-09-17T08:05:01Z", created_at: "x" })).toBe(
      "2026-09-17T08:05:01Z",
    );
    expect(wasteReceivedLate({ occurred_at: occurred, created_at: "2026-09-17T11:00:00Z" })).toBe("2026-09-17T11:00:00Z");
    expect(wasteReceivedLate({ occurred_at: null, created_at: "2026-09-17T11:00:00Z" })).toBeNull();
  });
});

describe("below zero", () => {
  it("marks only a negative figure", () => {
    expect(isBelowZero(-0.5)).toBe(true);
    expect(isBelowZero(0)).toBe(false);
    expect(isBelowZero(3)).toBe(false);
    expect(isBelowZero(null)).toBe(false);
  });
});

describe("transferActions", () => {
  const tr = (status: string) => ({ status, source_branch_id: "wh", destination_branch_id: "shop" }) as Parameters<typeof transferActions>[0];
  const shop = new Set(["shop"]);
  const both = new Set(["wh", "shop"]);

  it("gives each side its own steps", () => {
    expect(transferActions(tr("requested"), shop).sort()).toEqual(["cancel", "edit"]);
    expect(transferActions(tr("requested"), new Set(["wh"])).sort()).toEqual(["accept", "decline"]);
    expect(transferActions(tr("dispatched"), shop)).toEqual(["receive"]);
    expect(transferActions(tr("received"), both)).toEqual([]);
  });

  it("needs the capability too: cancelling stock in transit is .delete", () => {
    const noDelete = (c: string) => c !== "inventory.transfers.delete";
    expect(transferActions(tr("dispatched"), both, noDelete as never)).toEqual(["receive"]);
    expect(transferActions(tr("draft"), both, noDelete as never).sort()).toEqual(["cancel", "dispatch", "edit"]);
  });

  it("checks the capability at the acting side's location, not anywhere", () => {
    // Works at both, but may receive (.edit) only at the warehouse: the shop is the receiving side.
    const editAtWh = (c: string, at: string) => c !== "inventory.transfers.edit" || at === "wh";
    expect(transferActions(tr("dispatched"), both, editAtWh as never)).toEqual(["cancel"]);
    // Creates only at the shop: it can withdraw its own request but not answer one.
    const createAtShop = (c: string, at: string) => c !== "inventory.transfers.create" || at === "shop";
    expect(transferActions(tr("requested"), both, createAtShop as never).sort()).toEqual(["cancel", "edit"]);
    expect(transferActions(tr("draft"), both, createAtShop as never)).toEqual([]);
  });
});

describe("purchase line costs", () => {
  it("derives the unit cost from the invoice total, unrounded", () => {
    // The field report: 12 000 g of milk for 548.16 EGP is 4.568 piastres/g,
    // not the 5 a whole-piastre unit cost made it (600.00 EGP).
    expect(unitCostFromTotal(54816, 12000)).toBeCloseTo(4.568, 9);
    expect(unitCostFromTotal(54816, 0)).toBeNull();
    expect(unitCostFromTotal(-1, 10)).toBeNull();
    expect(unitCostFromTotal(Number.NaN, 10)).toBeNull();
    // D7: the quantity is the server's 3 dp, half away from zero (0.0625 → 0.063).
    expect(unitCostFromTotal(1000, 0.0625)).toBe(15873.01587302);
    expect(unitCostFromTotal(1000, 0.0004)).toBeNull();
  });

  it("shows a unit cost with all six decimals, never a rounded-looking figure", () => {
    expect(formatUnitCost(54816 / 12000)).toBe("0.045680");
    expect(formatUnitCost(60000 / 12000)).toBe("0.050000");
    expect(formatUnitCost(10000 / 3)).toBe("33.333333");
  });

  it("estimates a line total from the catalog cost per stock unit", () => {
    expect(estimateLineTotal(4.568, 12000, "g", "g")).toBe(54816);
    expect(estimateLineTotal(4.568, 12, "kg", "g")).toBe(54816);
    expect(estimateLineTotal(null, 12, "kg", "g")).toBeNull();
    expect(estimateLineTotal(4.568, 0, "g", "g")).toBeNull();
    expect(estimateLineTotal(4.568, 12, "kg", "ml")).toBeNull();
    expect(estimateLineTotal(4.568, 12, "case", "pcs")).toBeNull();
    // D6: a kg ingredient at 50 000/kg, 1.5 g ordered, rounded once at the end.
    expect(estimateLineTotal(50_000, 1.5, "g", "kg")).toBe(75);
  });
});

// madar-shared's unit_vectors.json (src/lib, pinned to its tag): madar-units'
// conversions, through the wasm. Where plain `convert` (no density) answers
// like the case does, the units the dashboard offers for `from` include `to`.
describe("the unit rules match madar-shared's vectors", () => {
  it.each(unitVectors)("$qty $from → $to at $density", (v) => {
    expect(rules.convert_with_density(v.qty, v.from, v.to, v.density)).toEqual(v.result ?? { error: v.error });
    if (!v.same_without_density) return;
    const plain = rules.convert(v.qty, v.from, v.to);
    expect(typeof plain === "number" ? plain : null).toBe(v.result);
    if (v.result != null) expect(unitsForFamily(v.from)).toContain(v.to.trim().toLowerCase());
  });
});

// madar-shared's inventory_vectors.json (src/lib, pinned to its tag): the cases
// the backend's madar-inventory is tested against. The dashboard's wrappers of
// the step table and the receive check (the wasm) give the same answer on each.
describe("the transfer rules match madar-shared's vectors", () => {
  it.each(vectors.steps)("$status / $action", (v) => {
    const step = transferStep(v.status, v.action as Parameters<typeof transferStep>[1]);
    expect(step && { side: step.side, cap: step.cap }).toEqual(v.side ? { side: v.side, cap: v.cap } : null);
  });

  it.each(vectors.receives)("sent $qty_sent, got $qty_received, note $note", (v) => {
    const out = checkReceiveLine(v.qty_sent, v.qty_received, v.note);
    expect(out).toEqual(v.ok ?? { refused: v.refused });
  });

  // The dashboard shows the server's suggestion; this pins the wasm's copy.
  it.each(vectors.replenish)("replenish $input.on_hand of $input.par_min–$input.par_max", (v) => {
    expect(rules.replenish_suggest(v.input)).toEqual(v.out);
  });
});


// madar-shared's purchase_vectors.json (pinned by rev): madar-inventory's purchase
// rules through the dashboard's wrappers. Not run: `quantity[].milli` (the
// thousandths form; the web shows quantity_dec and never stores milli) and
// `line_costs` (the server's own order-line costing, which the web never does).
describe("the purchase rules match madar-shared's vectors", () => {
  it.each(purchase.quantity)("quantity $name", (c) => {
    expect(roundQty(c.q)).toBe(Number(c.quantity_dec));
  });
  it.each(purchase.delivery_cost)("delivery_cost $name", (c) => {
    const got = deliveryCost(c.quantity_received, c.line_cost, c.unit_cost, c.ordered_line_cost, Number(c.quantity_ordered));
    expect(got).toBe(c.error == null ? Number(c.expected) : null);
  });
  it.each(purchase.estimate_line_total)("estimate_line_total $name", (c) => {
    expect(estimateLineTotal(c.cost_per_stock_unit, c.qty, c.purchase_unit, c.stock_unit)).toBe(c.expected);
  });
  it.each(purchase.unit_cost_from_total)("unit_cost_from_total $name", (c) => {
    expect(unitCostFromTotal(c.line, c.qty)).toBe(c.expected);
  });
});

// madar-shared's count_vectors.json (pinned by rev): the variance flag the server refuses a finalize with.
describe("the count rule matches madar-shared's vectors", () => {
  it.each(countVectors.cases)("$name", (c) => {
    expect(isVarianceFlagged(c.book, c.counted, c.pct)).toBe(c.expected);
  });
});
