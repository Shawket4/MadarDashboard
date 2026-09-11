/* eslint-disable */
// @ts-nocheck

export interface TellerStats {
  /** Average bill as rung up — a refund does not shrink what was ordered. */
  avg_order_value: number;
  orders: number;
  /** Net of refunds against this teller's sales. */
  revenue: number;
  shifts: number;
  teller_id: string;
  teller_name: string;
  voided: number;
}
