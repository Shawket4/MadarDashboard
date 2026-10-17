/**
 * The checkout bill against madar-money's own vectors (src/lib, pinned to
 * their tag by shared_vectors.test.ts): `tax::compute` (tax_vectors.json) and
 * `bill::price_subtotal` (bill_vectors.json), the figures intake books.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { onlineBill, priceSubtotal, type TaxPolicy } from "./bill";
import { calcDiscount } from "./utils";
import type { DeliveryMenuDiscount } from "@/data/api/generated/models/deliveryMenuDiscount";

interface TaxVector {
  subtotal: number;
  discount_kind: string;
  discount_value: string;
  tax_rate: string;
  tax_inclusive: boolean;
  service_charge_rate: string;
  service_charge_taxable: boolean;
  channel: string;
  service_waived: boolean;
  discount: number;
  service_charge: number;
  tax: number;
  total: number;
  net: number;
}

interface BillVector {
  subtotal: number;
  out_subtotal?: number;
  discount: { kind: string; value: string };
  policy: TaxPolicy & { tax_rate: string; service_charge_rate: string };
  discount_amount: number;
  service_charge: number;
  tax: number;
  total: number;
}

// Read, not imported: megabytes of JSON are not worth a type.
const read = <T,>(name: string): T => JSON.parse(readFileSync(resolve(__dirname, `../../lib/${name}`), "utf8")) as T;
const taxVectors = read<TaxVector[]>("tax_vectors.json");
const billVectors = read<{ bills: BillVector[]; open_bills: BillVector[] }>("bill_vectors.json");

// madar-money `TaxPolicy::for_sale`: only a table's bill carries the service charge.
const forSale = (v: TaxVector): TaxPolicy => ({
  tax_rate: v.tax_rate,
  tax_inclusive: v.tax_inclusive,
  service_charge_rate: v.channel === "dine_in" && !v.service_waived ? v.service_charge_rate : "0",
  service_charge_taxable: v.service_charge_taxable,
});

describe("priceSubtotal is madar-money's tax::compute (tax_vectors.json)", () => {
  it("covers the online channel and both inclusivities", () => {
    expect(taxVectors.length).toBeGreaterThan(4000);
    expect(taxVectors.some((v) => v.channel === "online" && v.tax_inclusive)).toBe(true);
    expect(taxVectors.some((v) => v.channel === "online" && !v.tax_inclusive && v.tax > 0)).toBe(true);
  });

  it("gives every vector's figures", () => {
    const wrong = taxVectors.flatMap((v, i) => {
      const got = priceSubtotal(v.subtotal, v.discount, forSale(v));
      const want = { subtotal: v.subtotal, discount: v.discount, service_charge: v.service_charge, tax: v.tax, total: v.total, net: v.net };
      return JSON.stringify(got) === JSON.stringify(want) ? [] : [{ i, v, got }];
    });
    expect(wrong.slice(0, 3)).toEqual([]);
  });
});

describe("priceSubtotal is madar-money's bill::price_subtotal (bill_vectors.json)", () => {
  it.each([...billVectors.bills, ...billVectors.open_bills].filter((_, i) => i % 7 === 0))(
    "$subtotal, $discount.kind $discount.value, $policy.tax_rate incl=$policy.tax_inclusive",
    (b) => {
      const subtotal = b.out_subtotal ?? b.subtotal;
      const got = priceSubtotal(subtotal, b.discount_amount, b.policy);
      expect({ service_charge: got.service_charge, tax: got.tax, total: got.total }).toEqual({
        service_charge: b.service_charge,
        tax: b.tax,
        total: b.total,
      });
    },
  );
});

describe("onlineBill is what intake books", () => {
  const exclusive = { tax_rate: 0.14, tax_inclusive: false };
  const inclusive = { tax_rate: 0.14, tax_inclusive: true };

  it("adds exclusive tax to the items (the 75 EGP basket booked at 83.40 with a 1.50 fee)", () => {
    const bill = onlineBill({ itemsTotal: 6000, afterDeals: 6000, discount: 0, deliveryFee: 1500, policy: exclusive });
    expect(bill.tax).toBe(840);
    expect(bill.total).toBe(8340);
  });

  it("keeps the fee outside the tax base", () => {
    expect(onlineBill({ itemsTotal: 7500, afterDeals: 7500, discount: 0, deliveryFee: 0, policy: exclusive }).total).toBe(8550);
    expect(onlineBill({ itemsTotal: 7500, afterDeals: 7500, discount: 0, deliveryFee: 2500, policy: exclusive }).total).toBe(11050);
  });

  it("taxes what is left after deals and the channel discount", () => {
    const discount = calcDiscount(9000, { dtype: "percentage", value: 10, value_rate: 0.1 } as DeliveryMenuDiscount);
    const bill = onlineBill({ itemsTotal: 12000, afterDeals: 9000, discount, deliveryFee: 1000, policy: exclusive });
    expect(discount).toBe(900);
    expect(bill.tax).toBe(1134); // 8100 × 0.14
    expect(bill.total).toBe(8100 + 1134 + 1000);
  });

  it("names the tax inside an inclusive total without growing it", () => {
    const bill = onlineBill({ itemsTotal: 7500, afterDeals: 7500, discount: 0, deliveryFee: 1000, policy: inclusive });
    expect(bill.tax).toBe(921); // 7500 − round(7500 / 1.14)
    expect(bill.taxInclusive).toBe(true);
    expect(bill.total).toBe(8500);
  });

  it("charges no tax when the branch has none, or the server sends no policy", () => {
    expect(onlineBill({ itemsTotal: 7500, afterDeals: 7500, discount: 0, deliveryFee: 0, policy: { tax_rate: 0, tax_inclusive: false } }).total).toBe(7500);
    expect(onlineBill({ itemsTotal: 7500, afterDeals: 7500, discount: 0, deliveryFee: null, policy: null }).total).toBe(7500);
  });
});
