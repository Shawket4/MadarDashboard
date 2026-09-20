/* eslint-disable */
// @ts-nocheck

export interface UpdateCustomerRequest {
  /**
     * `en` or `ar`. Absent = unchanged.
     * @nullable
     */
  locale?: string | null;
  /**
     * DEPRECATED and ignored (see `CreateCustomerRequest`).
     * @nullable
     */
  loyalty_customer_id?: string | null;
  /**
     * Absent = unchanged.
     * @nullable
     */
  marketing_opt_out?: boolean | null;
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
  /**
     * DEPRECATED and ignored: leaving the programme is
     * `DELETE /loyalty/members/{id}`.
     */
  unlink_loyalty?: boolean;
}
