/* eslint-disable */
// @ts-nocheck
import type { ReconciliationInput } from './reconciliationInput';

export interface CloseTillRequest {
  /** @nullable */
  cash_note?: string | null;
  /** @nullable */
  closed_at?: string | null;
  closing_cash_declared: number;
  /** @nullable */
  device_id?: string | null;
  /**
     * Held orders (and open counter carts) still parked on the device when
     * the teller chose to close anyway, and their total. Additive; older
     * tills omit them.
     * @nullable
     */
  held_orders_left_open?: number | null;
  /** @nullable */
  held_orders_left_open_total?: number | null;
  /**
     * Absent (old clients) → every used method is stored `unreviewed`.
     * @nullable
     */
  reconciliation?: ReconciliationInput[] | null;
}
