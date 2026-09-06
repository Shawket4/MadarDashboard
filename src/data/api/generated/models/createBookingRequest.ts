/* eslint-disable */
// @ts-nocheck

export interface CreateBookingRequest {
  branch_id: string;
  /**
     * Defaults to the branch's `default_duration_minutes`.
     * @nullable
     */
  duration_minutes?: number | null;
  /**
     * Create even when no table fits (the booking shows as "needs a table").
     * @nullable
     */
  force?: boolean | null;
  guest_name: string;
  guest_phone: string;
  /**
     * `en` | `ar` for the guest's messages.
     * @nullable
     */
  locale?: string | null;
  /** @nullable */
  notes?: string | null;
  party_size: number;
  /**
     * Seating preference for the auto-assigner.
     * @nullable
     */
  section_id?: string | null;
  /**
     * Send the WhatsApp confirmation (default true).
     * @nullable
     */
  send_confirmation?: boolean | null;
  starts_at: string;
  /**
     * Explicit tables (skips auto-assignment). Empty = deliberately none.
     * @nullable
     */
  table_ids?: string[] | null;
}
