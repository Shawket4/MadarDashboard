/* eslint-disable */
// @ts-nocheck

export interface CreateBookingRequest {
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  /**
     * `reservation` or `walk_in`. Defaults from whether `reserved_for` is set.
     * @nullable
     */
  kind?: string | null;
  /** @nullable */
  notes?: string | null;
  /** @nullable */
  party_size?: number | null;
  /** @nullable */
  quoted_ready_at?: string | null;
  /** @nullable */
  reserved_for?: string | null;
}
