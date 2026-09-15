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
