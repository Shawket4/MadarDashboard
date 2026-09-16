/* eslint-disable */
// @ts-nocheck

export interface UpdateCustomerRequest {
  /**
     * Absent = unchanged.
     * @nullable
     */
  loyalty_customer_id?: string | null;
  /** @nullable */
  name?: string | null;
  /**
     * Absent = unchanged; `""` clears.
     * @nullable
     */
  notes?: string | null;
  /**
     * Absent = unchanged; `""` clears.
     * @nullable
     */
  phone?: string | null;
  /** `true` unlinks the loyalty member. */
  unlink_loyalty?: boolean;
}
