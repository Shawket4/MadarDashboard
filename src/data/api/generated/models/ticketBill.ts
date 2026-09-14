/* eslint-disable */
// @ts-nocheck

/**
 * What the party owes, priced where the books are priced.
 *
 * The till used to show the ticket's running `subtotal` and collect that,
 * while the settle booked subtotal − discount + service charge + tax. Every
 * such drawer was short by the tax on every table sale, and the drift check
 * at settle now refuses that figure outright — so the till must be shown the
 * right one, and only the server knows the branch's policy. Priced under the
 * same engine and the same resolved policy as `create_order_inner`, with the
 * service charge on (a ticket is dine-in by definition, ruling 2). For a
 * settled ticket the figures are the ORDER's, as booked, not a repricing
 * under today's policy.
 */
export interface TicketBill {
  /**
     * The waiter's discount, resolved (a `discount_id` is looked up the way
     * the settle looks it up). A cashier who clears it at settle will see a
     * different total than this one, and that is the point of showing it.
     */
  discount_amount: number;
  service_charge_amount: number;
  service_charge_rate: number;
  /**
     * Whether the service charge sits inside the tax base. Frozen on the bill
     * with the rates, so a till re-pricing the bill (a discount, a reward, a
     * voided line) prices it the way the settle will. Additive: a bill from
     * an older server decodes as `true`, `TaxPolicy::default()`'s value.
     */
  service_charge_taxable?: boolean;
  /** Live lines as charged, before discount. Gross when tax-inclusive. */
  subtotal: number;
  /** Inside the total when `tax_inclusive`, on top of it otherwise. */
  tax_amount: number;
  tax_inclusive: boolean;
  /** The rates the figures were computed under, for the printed bill. */
  tax_rate: number;
  /** What the drawer must collect. */
  total: number;
}
