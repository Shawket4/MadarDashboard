/* eslint-disable */
// @ts-nocheck
import type { LoyaltyRedemptionInput } from './loyaltyRedemptionInput';

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
  /**
     * The member spending a balance on this settle, when rewards are applied.
     * @nullable
     */
  loyalty_customer_id?: string | null;
  /**
     * Rewards covering lines of the ticket. A table-service bill redeems
     * exactly like a counter one — the cashier scans at settle either way.
     */
  loyalty_redemptions?: LoyaltyRedemptionInput[];
  payment_method: string;
  shift_id: string;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
}
