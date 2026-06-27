/* eslint-disable */
// @ts-nocheck
import type { OrderItemInput } from './orderItemInput';
import type { PaymentSplitInput } from './paymentSplitInput';

export interface CreateOrderRequest {
  /** @nullable */
  amount_tendered?: number | null;
  branch_id: string;
  /** @nullable */
  change_given?: number | null;
  /** @nullable */
  created_at?: string | null;
  /** @nullable */
  customer_name?: string | null;
  /** @nullable */
  discount_amount?: number | null;
  /** @nullable */
  discount_id?: string | null;
  /** @nullable */
  discount_type?: string | null;
  /** @nullable */
  discount_value?: number | null;
  /** @nullable */
  idempotency_key?: string | null;
  items: OrderItemInput[];
  /** @nullable */
  notes?: string | null;
  /**
     * Client-minted human order number (the device's per-day sequence). Stored
   * VERBATIM when present — the device is authoritative so its OFFLINE receipt
   * at ring-up is byte-identical to the synced reprint. Absent → the server
   * computes a per-shift number.
     * @nullable
     */
  order_number?: number | null;
  /**
     * Client-minted order reference (`<BRANCH>-<YYMMDD>-<DEVICE>-<NNNN>`). Stored
   * verbatim when present; absent → the server mints the deterministic
   * shift-based ref. The global `UNIQUE(order_ref)` index keeps both paths
   * collision-safe (a managed per-device code makes concurrent tills unique).
     * @nullable
     */
  order_ref?: string | null;
  payment_method: string;
  /** @nullable */
  payment_splits?: PaymentSplitInput[] | null;
  shift_id: string;
  /** @nullable */
  subtotal?: number | null;
  /** @nullable */
  tax_amount?: number | null;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
  /** @nullable */
  total_amount?: number | null;
}
