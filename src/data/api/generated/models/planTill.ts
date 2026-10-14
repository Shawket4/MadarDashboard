/* eslint-disable */
// @ts-nocheck

export interface PlanTill {
  /**
     * `false`: the plan switched this till off (not its branch's active one).
     * Always `true` on Paid.
     */
  active: boolean;
  /** The till's short code on receipts (`T1`). */
  code: string;
  device_id: string;
  /** @nullable */
  label?: string | null;
  /**
     * When the till last rang a sale, if it ever did.
     * @nullable
     */
  last_sale_at?: string | null;
  /** When the till last talked to the server. */
  last_seen_at: string;
}
