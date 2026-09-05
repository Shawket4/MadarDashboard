/* eslint-disable */
// @ts-nocheck

/**
 * The slice of a booking the floor needs to show a held/reserved table.
 */
export interface TableBookingHint {
  booking_id: string;
  ends_at: string;
  guest_name: string;
  /** `starts_at - hold_minutes`: from here the table reads as held. */
  held_from: string;
  party_size: number;
  starts_at: string;
  /** `confirmed` | `seated`. */
  status: string;
}
