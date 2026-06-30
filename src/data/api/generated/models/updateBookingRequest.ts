/* eslint-disable */
// @ts-nocheck

export interface UpdateBookingRequest {
  /** @nullable */
  customer_name?: string | null;
  /** @nullable */
  notes?: string | null;
  /** @nullable */
  party_size?: number | null;
  /** @nullable */
  quoted_ready_at?: string | null;
  /** @nullable */
  reserved_for?: string | null;
  /**
     * Drive the status machine: confirmed / notified / arrived / seated /
   * completed / no_show / cancelled. The matching timestamp is stamped and,
   * for terminals, assigned tables are freed.
     * @nullable
     */
  status?: string | null;
}
