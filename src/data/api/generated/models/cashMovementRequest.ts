/* eslint-disable */
// @ts-nocheck

export interface CashMovementRequest {
  amount: number;
  /**
     * When the movement actually happened. Omit for live (online) movements —
   * the server stamps `now()`. The POS sends this for movements made OFFLINE
   * so they keep their real time after syncing. Future values are rejected.
     * @nullable
     */
  created_at?: string | null;
  note: string;
}
