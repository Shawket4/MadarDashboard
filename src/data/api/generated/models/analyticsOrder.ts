/* eslint-disable */
// @ts-nocheck
import type { AnalyticsPayment } from './analyticsPayment';

/**
 * One order, reduced to the money that belongs to the order itself.
 */
export interface AnalyticsOrder {
  /**
     * Calendar day the order belongs to, in the branch's timezone. Derived
     * from `created_at` — the SAME derivation the receipt's `order_ref` uses,
     * so the date here always matches the date embedded in that reference.
     */
  business_date: string;
  created_at: string;
  /**
     * Delivery fee charged on this order, `0` for anything but delivery. Not
     * part of `total_amount` or any total; here so `payments` can be
     * reconciled.
     */
  delivery_fee: number;
  discount_amount: number;
  order_id: string;
  /** Per-shift sequence number shown on the POS. */
  order_number: number;
  /**
     * The human-readable reference printed on the receipt
     * (`<BRANCHCODE>-<YYMMDD>-<NNNN>`). Null for orders predating it.
     * @nullable
     */
  order_ref?: string | null;
  /**
     * The order's NOMINAL payment label: the single method it was paid with,
     * or the literal `"mixed"` when it was split across several. Use
     * `payments` for the real methods and amounts.
     */
  payment_method: string;
  /**
     * What was actually paid, one entry per payment: a single-method order
     * has one, a split order one per part. The amounts add up to what the
     * customer was charged, which is `total_amount + delivery_fee`.
     */
  payments: AnalyticsPayment[];
  /**
     * The service charge added to this order, `0` where the branch charges
     * none. This was a hard-coded `0` for every order — the field was
     * published as if it meant something while a service charge did not
     * exist. It does now, and this is it.
     */
  service_charge: number;
  status: string;
  /**
     * Piastres. Sum of the line items before discount. On a branch whose
     * prices include tax this already contains the tax.
     */
  subtotal: number;
  tax_amount: number;
  /**
     * The order's own value: `subtotal - discount_amount + service_charge`,
     * plus `tax_amount` where tax is added on top of the prices (where prices
     * include tax it is already inside `subtotal`). This is what the customer
     * was charged less any delivery fee. Tips are not part of it.
     *
     * It used to be computed as `subtotal - discount + service_charge + tax`
     * on every order, which counted the tax twice on a tax-inclusive branch.
     */
  total_amount: number;
}
