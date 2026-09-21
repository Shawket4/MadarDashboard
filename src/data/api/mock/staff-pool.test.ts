/**
 * The mock pool must obey the wire contract it stands in for, or the preview
 * teaches the wrong arithmetic: stored money is NET of the comp, the summary is
 * the sum of the rows under it, and an old till's row has no figures at all.
 */
import { describe, expect, it } from "vitest";

import { orderStaffComp, staffDrinkLine } from "@/features/orders/staff-drink-lines";
import { staffDrinkMoney } from "@/features/staff-pool/util";

import { MOCK_STAFF_ORDER, mockStaffDrinks, mockStaffDrinksSummary, mockStaffOrder } from "./staff-pool";

describe("the mock staff pool", () => {
  it("seeds every kind of row the report reads", () => {
    const money = mockStaffDrinks("2026-09-21").map(staffDrinkMoney);
    expect(money.some((m) => !m.priced)).toBe(true);
    expect(money.some((m) => m.priced && m.tillSaid != null)).toBe(true);
    expect(money.some((m) => m.priced && (m.extras ?? 0) > 0)).toBe(true);
    expect(money.some((m) => m.priced && m.extras === 0 && m.tillSaid == null)).toBe(true);
  });

  it("summarises exactly the rows it lists", () => {
    const rows = mockStaffDrinks("2026-09-21");
    expect(mockStaffDrinksSummary("2026-09-21")).toEqual({
      drinks: 4,
      quantity: 4,
      overspent: 1,
      comp_minor: 4500 + 8000 + 5500,
      extras_minor: 4000,
      cost_minor: 900 + 2150 + 1300 + 1700,
      comp_mismatches: 1,
      unpriced: 1,
    });
    expect(rows.every((d) => d.business_date === "2026-09-21")).toBe(true);
    expect(mockStaffDrinksSummary("2026-09-21", true).drinks).toBe(1);
  });

  it("stores the sale net of the comp, and its totals add up", () => {
    const o = MOCK_STAFF_ORDER;
    const charged = o.items.reduce((s, it) => s + (staffDrinkLine(it)?.charged ?? it.line_total), 0);
    expect(charged).toBe(o.subtotal);
    expect(o.subtotal + o.tax_amount).toBe(o.total_amount);
    expect(Math.round(o.subtotal * 0.14)).toBe(o.tax_amount);
    // The order's comp and extras are the drink row's.
    const row = mockStaffDrinks(null).find((d) => d.order_id === o.id)!;
    expect(orderStaffComp(o.items)).toBe(row.comp_minor);
    expect(staffDrinkLine(o.items[0])?.charged).toBe(row.extras_minor);
  });

  it("has a sale behind every drink that links to one, and none behind the old till's", () => {
    for (const d of mockStaffDrinks(null)) {
      if (d.order_id) expect(mockStaffOrder(d.order_id)?.id).toBe(d.order_id);
    }
    expect(mockStaffOrder("ord_42")).toBeNull();
  });
});
