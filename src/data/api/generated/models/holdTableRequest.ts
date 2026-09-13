/* eslint-disable */
// @ts-nocheck

export interface HoldTableRequest {
  branch_id: string;
  /**
     * How many people sat down (covers), as the host counted them. Recorded
     * on the hold and inherited by the bill's first round when it carries no
     * guest count of its own. Anything not positive is not recorded.
     * @nullable
     */
  party_size?: number | null;
  /**
     * When the party actually sat down, by the till's clock. An offline seat
     * replays later than it happened; this keeps every device's table clock
     * on the seating. Clamped server-side to the last 12 hours, never in the
     * future, and never before the table's previous party left. Recorded only
     * -- it moves no status.
     * @nullable
     */
  seated_at?: string | null;
}
