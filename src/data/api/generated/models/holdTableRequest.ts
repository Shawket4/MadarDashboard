/* eslint-disable */
// @ts-nocheck

export interface HoldTableRequest {
  branch_id: string;
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
