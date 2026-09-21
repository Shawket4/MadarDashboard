/* eslint-disable */
// @ts-nocheck

/**
 * One till session, the way a manager reconciles a drawer: what was in it at
 * open, what cash the shift put through it, what the teller declared at close,
 * and what the system says should have been there.
 *
 * Money is piastres. `null` means *not yet known* (an open till has no closing
 * figures), never zero — a till still running and a till that counted zero are
 * different facts.
 *
 * The cash columns add up: `opening_cash + net_cash_payment + pay_ins −
 * pay_outs − cash_drops + cash_adjustments` is the drawer's expected cash —
 * `closing_cash_system` once the till is closed.
 */
export interface TillSessionRow {
  /** The branch's short code, the prefix of its order references. */
  branch_code: string;
  branch_id: string;
  branch_name: string;
  /**
     * The branch-local calendar day the till was OPENED on — a till opened at
     * 23:50 and closed at 02:10 belongs to the day it opened, which is the
     * day the takings are reported under.
     */
  business_date: string;
  /**
     * Corrections that name no movement of the three kinds above. Signed:
     * positive = cash the drawer gained. The till report's `cash_adjustments`.
     */
  cash_adjustments: number;
  /**
     * Declared − expected. Negative = short, positive = over.
     * @nullable
     */
  cash_discrepancy?: number | null;
  /**
     * Cash moved to the safe, net of corrections to safe drops.
     * Positive = the magnitude that left.
     */
  cash_drops: number;
  /** @nullable */
  closed_at?: string | null;
  /**
     * What was counted at close. `null` while the till is open, and for a
     * force-close nobody counted.
     * @nullable
     */
  closing_cash_declared?: number | null;
  /**
     * What the system expected at close. `null` while the till is open.
     * @nullable
     */
  closing_cash_system?: number | null;
  /**
     * Cash that came in over the counter: cash payments and cash tips on
     * tendered sales, less cash handed back as refunds from this drawer.
     */
  net_cash_payment: number;
  /**
     * Those sales' value, net of what refunds took back (`net_sales` in the
     * POS metrics report, `revenue` in the teller report).
     */
  net_sales: number;
  opened_at: string;
  opening_cash: number;
  /**
     * Sales rung on this till, voided and fully-refunded bills excluded —
     * the same count the teller report uses.
     */
  orders_count: number;
  /**
     * Cash added to the drawer that is not a sale (a float top-up), net of
     * corrections to pay-ins.
     */
  pay_ins: number;
  /**
     * Cash spent out of the drawer, net of corrections to pay-outs.
     * Positive = the magnitude that left.
     */
  pay_outs: number;
  /** `open` | `closed` | `force_closed`. */
  status: string;
  teller_id: string;
  teller_name: string;
  till_id: string;
}
