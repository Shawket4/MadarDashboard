/**
 * What an online order will be charged, as intake books it.
 *
 * MadarRust `create_delivery_order` prices the items (deals applied, the
 * cart quote's `total_after_deals`), takes the channel discount off them,
 * runs madar-money's `bill::price_subtotal` under the branch's online tax
 * policy (`OnlineTaxPolicy`: the rate and whether menu prices contain it; an
 * online order never carries a service charge), and adds the delivery fee
 * after the tax, outside its base. This is that last step, so the checkout
 * shows the figure the order is booked at.
 *
 * ponytail: madar-web does not export `price_subtotal` yet (madar-shared
 * v0.9.0), so `priceSubtotal` is madar-money's `tax::compute` restated in
 * exact decimal arithmetic and pinned to the crate's own vectors
 * (bill.test.ts: tax_vectors.json, bill_vectors.json). When madar-web
 * exports it, call `rules.*` here and keep the vectors test.
 */
import type { OnlineTaxPolicy } from "@/data/api/generated/models/onlineTaxPolicy";
import type { CartQuote } from "@/data/api/generated/models/cartQuote";
import type { QuotedDeal } from "@/data/api/generated/models/quotedDeal";

import type { CartLine } from "./types";
import { cartSubtotal } from "./utils";

/** madar-money `TaxPolicy`. Rates are fractions (`0.14` is 14%), as numbers or decimal strings. */
export interface TaxPolicy {
  tax_rate: number | string;
  tax_inclusive: boolean;
  service_charge_rate?: number | string;
  service_charge_taxable?: boolean;
}

/** madar-money `tax::Breakdown`, in piastres. */
export interface Breakdown {
  subtotal: number;
  discount: number;
  service_charge: number;
  tax: number;
  /** subtotal − discount + service charge, + tax when exclusive. */
  total: number;
  net: number;
}

/** A decimal as `n / 10^scale`, exactly (rates come as `0.14` or `"0.145"`). */
function decimal(v: number | string | undefined): { n: bigint; d: bigint } {
  if (v == null) return { n: 0n, d: 1n };
  // A number's shortest round-trip form is the decimal the server sent
  // (`Decimal::to_f64` of a numeric(5,4)); toFixed would add float noise.
  let s = typeof v === "number" ? String(v) : v.trim();
  let exp = 0;
  const e = s.search(/e/i);
  if (e >= 0) {
    exp = Number(s.slice(e + 1));
    s = s.slice(0, e);
  }
  const neg = s.startsWith("-");
  if (neg || s.startsWith("+")) s = s.slice(1);
  const [int = "0", frac = ""] = s.split(".");
  let n = BigInt((int || "0") + frac);
  let scale = frac.length - exp;
  if (scale < 0) {
    n *= 10n ** BigInt(-scale);
    scale = 0;
  }
  return { n: neg ? -n : n, d: 10n ** BigInt(scale) };
}

/** `p / q` rounded half away from zero (rust_decimal `MidpointAwayFromZero`), q > 0. */
function roundDiv(p: bigint, q: bigint): bigint {
  const abs = p < 0n ? -p : p;
  const r = (2n * abs + q) / (2n * q);
  return p < 0n ? -r : r;
}

/** `v × rate`, rounded to the piastre. */
const timesRate = (v: number, rate: { n: bigint; d: bigint }): number => Number(roundDiv(BigInt(v) * rate.n, rate.d));

/**
 * madar-money `bill::price_subtotal` with a stated discount amount (what the
 * server holds after resolving the channel's rule): `tax::compute`.
 */
export function priceSubtotal(subtotal: number, discountAmount: number, policy: TaxPolicy): Breakdown {
  const discount = Math.min(Math.max(discountAmount, 0), Math.max(subtotal, 0));
  const base = Math.max(subtotal - discount, 0);
  const service = timesRate(base, decimal(policy.service_charge_rate));
  const taxedGross = policy.service_charge_taxable === false ? base : base + service;
  const rate = decimal(policy.tax_rate);
  let tax: number;
  let total: number;
  if (policy.tax_inclusive) {
    // gross − gross / (1 + rate): the tax is already inside the prices.
    const divisor = rate.d + rate.n; // (1 + rate) × d
    const netOfTax = divisor === 0n ? taxedGross : Number(roundDiv(BigInt(taxedGross) * rate.d, divisor));
    tax = taxedGross - netOfTax;
    total = base + service;
  } else {
    tax = timesRate(taxedGross, rate);
    total = base + service + tax;
  }
  return { subtotal, discount, service_charge: service, tax, total, net: total - tax };
}

/** The bill a storefront basket shows: every figure the order will carry. */
export interface OnlineBill {
  /** Items before deals. */
  subtotal: number;
  /** The deals the server applied (each a row under the subtotal). */
  deals: QuotedDeal[];
  /** The channel discount, off the items after deals. */
  discount: number;
  /** The tax on the order; inside `total` either way. */
  tax: number;
  /** Menu prices already contain the tax (the total does not grow by it). */
  taxInclusive: boolean;
  /** Fraction (`0.14`); 0 when the branch charges none. */
  taxRate: number;
  /** null = not known yet; undefined = no delivery at all (a table's basket). */
  deliveryFee: number | null | undefined;
  /** What the customer pays: what intake books as `total`. */
  total: number;
}

/**
 * The order's bill: items after deals, less the channel discount, taxed under
 * the branch's online policy, plus the delivery fee. No policy (an older
 * server, or still loading) prices it untaxed — an older server's intake did.
 */
export function onlineBill({
  itemsTotal,
  afterDeals,
  deals = [],
  discount,
  deliveryFee,
  policy,
}: {
  itemsTotal: number;
  afterDeals: number;
  deals?: QuotedDeal[];
  discount: number;
  deliveryFee?: number | null;
  policy?: OnlineTaxPolicy | null;
}): OnlineBill {
  const b = priceSubtotal(afterDeals, discount, {
    tax_rate: policy?.tax_rate ?? 0,
    tax_inclusive: policy?.tax_inclusive ?? false,
  });
  return {
    subtotal: itemsTotal,
    deals,
    discount: b.discount,
    tax: b.tax,
    taxInclusive: policy?.tax_inclusive ?? false,
    taxRate: policy?.tax_rate ?? 0,
    deliveryFee,
    total: b.total + (deliveryFee ?? 0),
  };
}

/**
 * The basket's bill as intake will book it: the server's figures when it has
 * quoted this cart (deals applied), else the estimate; the channel discount
 * off what is left after the deals, the tax on that, the fee on top.
 */
export const basketBill = (
  lines: CartLine[],
  quote: CartQuote | null | undefined,
  discount: number,
  fee: number | null | undefined,
  policy: OnlineTaxPolicy | null | undefined,
): OnlineBill => {
  const estimate = cartSubtotal(lines);
  return onlineBill({
    itemsTotal: quote ? quote.items_total : estimate,
    afterDeals: quote ? quote.total_after_deals : estimate,
    deals: quote?.deals ?? [],
    discount,
    deliveryFee: fee,
    policy,
  });
};

/** The tax as `Totals` shows it. */
export const taxOf = (bill: OnlineBill): TaxLine => ({ amount: bill.tax, inclusive: bill.taxInclusive, rate: bill.taxRate });

/** The tax on a bill, as `Totals` shows it. `rate` is a fraction (`0.14`). */
export interface TaxLine {
  amount: number;
  inclusive: boolean;
  rate: number;
}
