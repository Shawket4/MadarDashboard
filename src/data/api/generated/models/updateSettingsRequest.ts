/* eslint-disable */
// @ts-nocheck

export interface UpdateSettingsRequest {
  /** @nullable */
  accepting_reservations?: boolean | null;
  /** @nullable */
  accepting_waitlist?: boolean | null;
  /** @nullable */
  grace_minutes?: number | null;
  /** @nullable */
  hold_lead_minutes?: number | null;
  /** @nullable */
  lead_minutes?: number | null;
  /** @nullable */
  max_party_size?: number | null;
  /** @nullable */
  slot_minutes?: number | null;
}
