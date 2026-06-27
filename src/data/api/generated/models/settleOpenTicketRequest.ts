/* eslint-disable */
// @ts-nocheck

export interface SettleOpenTicketRequest {
  /** @nullable */
  amount_tendered?: number | null;
  /**
     * Settle-time overrides (else the ticket's own discount / no tip).
     * @nullable
     */
  discount_id?: string | null;
  /** @nullable */
  discount_type?: string | null;
  /** @nullable */
  discount_value?: number | null;
  payment_method: string;
  shift_id: string;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
}
