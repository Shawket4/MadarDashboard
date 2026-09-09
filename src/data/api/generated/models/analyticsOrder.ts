/* eslint-disable */
// @ts-nocheck

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
     * The service charge added to this order, `0` where the branch charges
     * none. This was a hard-coded `0` for every order — the field was
     * published as if it meant something while a service charge did not
     * exist. It does now, and this is it.
     */
  service_charge: number;
  status: string;
  /** Piastres. Sum of the line items before discount and tax. */
  subtotal: number;
  tax_amount: number;
  /**
     * `subtotal - discount_amount + service_charge + tax_amount`. Deliberately COMPUTED rather
     * than read from `orders.total_amount`, which also carries the delivery
     * fee — this figure is the order's own value and nothing else. Tips are
     * excluded too (they are not part of `total_amount` in the first place).
     */
  total_amount: number;
}
