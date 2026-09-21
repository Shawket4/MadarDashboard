/* eslint-disable */
// @ts-nocheck

export interface TaxReport {
  discount_amount: number;
  /** @nullable */
  from?: string | null;
  /** `total_amount`, net of refunds, across every branch. */
  net_revenue: number;
  /** `tax_collected - refunded_tax` — what is actually owed for the period. */
  net_tax_due: number;
  order_count: number;
  /**
     * The org's current tax rate, as a decimal fraction. Informational only —
     * individual orders carry the rate that was actually applied at sale
     * time (`tax_rate_applied`), which may differ if the rate changed since.
     */
  org_tax_rate: number;
  refunded_tax: number;
  /** Net of refunded service charge. */
  service_charge_amount: number;
  /** Sum of `orders.subtotal` across every branch, before discount or tax. */
  subtotal: number;
  /**
     * Tax on every non-voided sale in the range, before refunds (a sale later
     * refunded in full included).
     */
  tax_collected: number;
  /** @nullable */
  to?: string | null;
  voided_orders: number;
}
