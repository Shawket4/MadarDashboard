/* eslint-disable */
// @ts-nocheck

export interface ReservationSettings {
  accepting_reservations: boolean;
  accepting_waitlist: boolean;
  branch_id: string;
  grace_minutes: number;
  hold_lead_minutes: number;
  lead_minutes: number;
  /** @nullable */
  max_party_size?: number | null;
  slot_minutes: number;
  updated_at: string;
}
