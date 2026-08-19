/* eslint-disable */
// @ts-nocheck

export interface ParkHeldOrderRequest {
  branch_id: string;
  /** Opaque client cart payload, stored and returned verbatim. */
  cart: unknown;
  /**
     * Original creation instant (strip ordering); defaults to now.
     * @nullable
     */
  created_at?: string | null;
  /**
     * The parking device's installation id (also the claim key on resume).
     * @nullable
     */
  device_id?: string | null;
  /** Client-minted id — the held order's identity across parks/resumes/devices. */
  id: string;
  name?: string;
  /**
     * Requested table. On conflict the park still succeeds WITHOUT the table
     * (`table_conflict: true` in the response) — a queued offline park must
     * never dead-letter over a table race.
     * @nullable
     */
  table_id?: string | null;
}
