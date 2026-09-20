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
 */
export interface TillSessionRow {
  /**
     * The branch's own reference/code, blank when the branch never set one.
     * @nullable
     */
  branch_code?: string | null;
  branch_name: string;
  /**
     * The branch-local calendar day the till was OPENED on — a till opened at
     * 23:50 and closed at 02:10 belongs to the day it opened, which is the
     * day the takings are reported under.
     */
  business_date: string;
  /**
     * Declared − expected. Negative = short, positive = over.
     * @nullable
     */
  cash_discrepancy?: number | null;
  /** Cash moved to the safe. Positive = the magnitude that left. */
  cash_drops: number;
  /** @nullable */
  closed_at?: string | null;
  /**
     * What the teller counted at close. `null` while the till is open.
     * @nullable
     */
  closing_cash_declared?: number | null;
  /**
     * What the system expected: opening + net cash + pay-ins − pay-outs −
     * drops (± corrections). `null` while the till is open.
     * @nullable
     */
  closing_cash_system?: number | null;
  /**
     * Those sales' value, net of what refunds took back. The house revenue
     * definition, so a till row and the teller report agree.
     */
  gross_sales: number;
  /**
     * Cash that came in over the counter: cash payments and cash tips on
     * tendered sales, less cash handed back as refunds from this drawer.
     */
  net_cash_payment: number;
  opened_at: string;
  opening_cash: number;
  /**
     * Sales rung on this till, voided and fully-refunded bills excluded —
     * the same count the teller report uses.
     */
  orders_count: number;
  /** Cash added to the drawer that is not a sale (a float top-up). */
  pay_ins: number;
  /** Cash spent out of the drawer. Positive = the magnitude that left. */
  pay_outs: number;
  /** `open` | `closed` | `force_closed`. */
  status: string;
  teller_name: string;
  till_id: string;
}
