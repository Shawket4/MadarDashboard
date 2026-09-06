/* eslint-disable */
// @ts-nocheck

export interface SeatBookingRequest {
  /**
     * Seat the party on these tables instead (a walk-in took theirs, or the
     * host prefers another). Omit to keep the claim.
     * @nullable
     */
  table_ids?: string[] | null;
}
