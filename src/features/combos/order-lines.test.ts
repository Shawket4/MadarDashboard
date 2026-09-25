/**
 * The order sheet's combo grouping, on the contract's worked vector
 * (§4 `combo/lunch_large_latte`, n = 1): shares 8571 / 2858 / 3571 + a Large
 * surcharge of 1000, with a 1500 oat add-on on the latte.
 */
import { describe, expect, it } from "vitest";

import { dealsOf, orderDealsTotal, orderRows } from "./order-lines";

const header = { id: "h", line_kind: "combo", line_total: 0, combo_unit_price: 15000, addons: [] };
const burger = { id: "p1", line_kind: "combo_part", combo_line_id: "h", combo_slot_name: "Main", line_total: 8571, combo_share: 8571, combo_surcharge: 0, addons: [] };
const fries = { id: "p2", line_kind: "combo_part", combo_line_id: "h", combo_slot_name: "Side", line_total: 2858, combo_share: 2858, combo_surcharge: 0, addons: [] };
const latte = {
  id: "p3",
  line_kind: "combo_part",
  combo_line_id: "h",
  combo_slot_name: "Drink",
  line_total: 4571,
  combo_share: 3571,
  combo_surcharge: 1000,
  addons: [{ line_total: 1500 }],
};
const cookie = { id: "x", line_kind: "item", line_total: 4000, addons: [] };

describe("orderRows", () => {
  it("puts each combo's parts under it and sums the header from the parts", () => {
    const rows = orderRows([header, burger, fries, latte, cookie]);
    expect(rows.map((r) => (r.kind === "combo" ? `combo:${r.line.id}` : `${r.part ? "part" : "line"}:${r.line.id}`))).toEqual([
      "combo:h",
      "part:p1",
      "part:p2",
      "part:p3",
      "line:x",
    ]);
    const head = rows[0];
    expect(head.kind === "combo" && head.total).toBe(8571 + 2858 + 4571 + 1500); // 17500 = unit_total
  });

  it("groups parts even when the server interleaves them", () => {
    const rows = orderRows([cookie, latte, header, burger, fries]);
    expect(rows.map((r) => r.line.id)).toEqual(["x", "h", "p3", "p1", "p2"]);
  });

  it("shows an orphaned part as a plain line rather than hiding its money", () => {
    const rows = orderRows([{ ...latte, combo_line_id: "gone" }, cookie]);
    expect(rows).toEqual([
      { kind: "line", line: expect.objectContaining({ id: "p3" }), part: false },
      { kind: "line", line: expect.objectContaining({ id: "x" }), part: false },
    ]);
  });

  it("leaves an old order (no line_kind) exactly as it was", () => {
    const old = [{ id: "a", line_total: 100 }, { id: "b", line_total: 200 }];
    expect(orderRows(old).map((r) => r.kind)).toEqual(["line", "line"]);
  });
});

describe("deals on an order", () => {
  it("reads deals leniently and totals their cut", () => {
    expect(dealsOf(null)).toEqual([]);
    expect(dealsOf({ deals: "nope" })).toEqual([]);
    const deals = dealsOf({ deals: [{ id: "d", deal_rule_id: "r", name: "Any 2", times: 1, discount: 2000, lines: [] }] });
    expect(orderDealsTotal(deals)).toBe(2000);
  });
});
