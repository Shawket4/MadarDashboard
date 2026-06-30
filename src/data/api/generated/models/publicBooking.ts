/* eslint-disable */
// @ts-nocheck

/**
 * Slim, guest-safe view (no org/internal columns).
 */
export interface PublicBooking {
  /**
     * OSRM drive estimate from the guest's saved location, when available.
     * @nullable
     */
  eta_minutes?: number | null;
  id: string;
  kind: string;
  party_size: number;
  /** @nullable */
  reserved_for?: string | null;
  status: string;
  table_count: number;
}
