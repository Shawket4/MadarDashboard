import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import type { OrderExport } from "@/data/api/generated/models";
import { fmtMoney } from "@/lib/format";

import { buildSheets } from "./build-sheets";
import { lineItemColumns, orderColumns, paymentText } from "./columns";

const t = ((key: string, fallback?: string) => fallback ?? key) as unknown as TFunction;

const split = {
  order_ref: "DT-1",
  order_number: 1,
  created_at: "2026-09-14T09:00:00Z",
  payment_method: "mixed",
  payment_legs: [
    { method: "cash", amount: 30000, is_cash: true },
    { method: "card", amount: 27000, is_cash: false },
  ],
  payments: [
    { id: "p1", order_id: "o1", method: "cash", amount: 30000 },
    { id: "p2", order_id: "o1", method: "card", amount: 27000 },
  ],
  total_amount: 57000,
  items: [{ item_name: "Latte", quantity: 1, unit_price: 57000, line_total: 57000, addons: [], optionals: [] }],
} as unknown as OrderExport;

describe("a split sale in the orders export", () => {
  it("states each leg's amount, never the bare 'mixed' label", () => {
    const text = paymentText(t, split.payment_method, split.payment_legs);
    expect(text).toBe(`cash ${fmtMoney(30000)} + card ${fmtMoney(27000)}`);
    const cell = orderColumns(t).find((c) => c.key === "payment_method")!;
    expect(cell.accessor(split)).toBe(text);
  });

  it("carries the legs onto the line items and lists them on the payments sheet", () => {
    const sheets = buildSheets([split], ["line_item", "payment"], t, "en");
    const [items, payments] = sheets;
    const col = lineItemColumns(t).find((c) => c.key === "payment_method")!;
    expect(col.accessor(items.rows[0] as never)).toBe(paymentText(t, "mixed", split.payment_legs));
    const amounts = payments.rows.map((r) => (r as { split_amount: number }).split_amount);
    expect(amounts).toEqual([30000, 27000]);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(split.total_amount);
  });

  it("keeps a single payment's method", () => {
    expect(paymentText(t, "cash", [{ method: "cash", amount: 100 }])).toBe("cash");
  });
});

describe("a staff drink in the orders export", () => {
  const pooled = {
    order_ref: "DT-2",
    order_number: 2,
    created_at: "2026-09-21T09:00:00Z",
    payment_method: "cash",
    subtotal: 10000,
    total_amount: 11400,
    items: [
      {
        item_name: "Latte",
        quantity: 1,
        unit_price: 8500,
        line_total: 1500,
        staff_comp_minor: 9000,
        staff_drink_id: "sd-1",
        addons: [
          { id: "a1", addon_name: "Whole milk", quantity: 1, unit_price: 2000, line_total: 0, staff_comp_minor: 2000 },
          { id: "a2", addon_name: "Extra shot", quantity: 1, unit_price: 2500, line_total: 2500, staff_comp_minor: 0 },
        ],
        optionals: [],
      },
      // A line from before the fields existed: neither key is on the wire.
      { item_name: "Croissant", quantity: 1, unit_price: 6000, line_total: 6000, addons: [], optionals: [] },
    ],
  } as unknown as OrderExport;

  it("gives the order sheet a given-free column beside the net subtotal", () => {
    const cols = orderColumns(t);
    const keys = cols.map((c) => c.key);
    expect(keys.indexOf("staff_comp")).toBe(keys.indexOf("subtotal") - 1);
    const col = cols.find((c) => c.key === "staff_comp")!;
    expect(col.type).toBe("money");
    expect(col.total).toBe(true);
    expect(col.accessor(pooled)).toBe(9000);
    expect(col.accessor(split)).toBe(0);
  });

  it("gives each line its comp and what the whole line was charged", () => {
    const [items] = buildSheets([pooled], ["line_item"], t, "en");
    const cols = lineItemColumns(t);
    const comp = cols.find((c) => c.key === "staff_comp")!;
    const charged = cols.find((c) => c.key === "staff_charged")!;
    expect(comp.header).toBe("Staff drinks given free");
    expect(items.rows.map((r) => comp.accessor(r as never))).toEqual([9000, 0]);
    // A paid line leaves the staff-charged cell blank: 0 would read as "free".
    expect(items.rows.map((r) => charged.accessor(r as never))).toEqual([4000, null]);
    // The stored line total is exported as stored — never netted a second time.
    const total = cols.find((c) => c.key === "line_total")!;
    expect(total.accessor(items.rows[0] as never)).toBe(1500);
  });

  it("has Arabic headers for both columns", async () => {
    const i18n = (await import("@/i18n")).default;
    const ar = i18n.getFixedT("ar");
    const headers = lineItemColumns(ar).map((c) => c.header);
    expect(headers).toContain("مشروبات موظفين اتقدّمت ببلاش");
    expect(headers).toContain("المدفوع في مشروب الموظفين (بالإضافات)");
  });
});
