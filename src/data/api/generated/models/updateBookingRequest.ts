/* eslint-disable */
// @ts-nocheck

export interface UpdateBookingRequest {
  /** @nullable */
  duration_minutes?: number | null;
  /**
     * Keep the booking when no table fits after a move (default true).
     * @nullable
     */
  force?: boolean | null;
  /** @nullable */
  guest_name?: string | null;
  /** @nullable */
  guest_phone?: string | null;
  /** @nullable */
  notes?: string | null;
  /** @nullable */
  party_size?: number | null;
  /** @nullable */
  section_id?: string | null;
  /** @nullable */
  starts_at?: string | null;
  /**
     * Present = reassign to exactly these tables (empty = unassign).
     * @nullable
     */
  table_ids?: string[] | null;
}
