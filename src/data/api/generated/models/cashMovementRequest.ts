/* eslint-disable */
// @ts-nocheck
import type { CashMovementKind } from './cashMovementKind';

export interface CashMovementRequest {
  amount: number;
  /**
     * Client-minted idempotency / reconciliation key. The POS sends a stable
     * UUID per movement so a replayed offline movement dedupes instead of
     * double-applying. Omit for live online movements.
     * @nullable
     */
  client_ref?: string | null;
  /**
     * For a `correction` only: the movement on this shift it reverses. The
     * amount must be the exact opposite of that row's, and a row may be
     * corrected once. Omit for a correction of something never recorded.
     * @nullable
     */
  corrects_id?: string | null;
  /**
     * When the movement actually happened. Omit for live (online) movements —
     * the server stamps `now()`. The POS sends this for movements made OFFLINE
     * so they keep their real time after syncing. Future values are rejected.
     * @nullable
     */
  created_at?: string | null;
  kind?: null | CashMovementKind;
  note: string;
}
