/* eslint-disable */
// @ts-nocheck

export interface HeldOrderView {
  branch_id: string;
  /** The opaque client cart payload, returned verbatim. */
  cart: unknown;
  /**
     * Set while `resumed` — the device editing the cart.
     * @nullable
     */
  claimed_by_device?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  /** @nullable */
  device_id?: string | null;
  id: string;
  name: string;
  /** @nullable */
  order_id?: string | null;
  revision: number;
  /** `held` | `resumed` | `completed` | `discarded`. */
  status: string;
  /** @nullable */
  table_id?: string | null;
  /**
     * Resolved display label of the assigned table (for lists/strips).
     * @nullable
     */
  table_label?: string | null;
  updated_at: string;
}
