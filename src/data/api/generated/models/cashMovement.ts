/* eslint-disable */
// @ts-nocheck

export interface CashMovement {
  amount: number;
  /**
     * Client-minted idempotency / reconciliation key, echoed back so an
     * offline client can map its queued movement to the server row. NULL for
     * live online movements.
     * @nullable
     */
  client_ref?: string | null;
  /**
     * For a `correction`: the movement it reverses. NULL for every other kind,
     * and for a correction of something never recorded as a row.
     * @nullable
     */
  corrects_id?: string | null;
  created_at: string;
  id: string;
  /**
     * One of `pay_in` / `pay_out` / `safe_drop` / `correction` — see
     * [`CashMovementKind`].
     */
  kind: string;
  moved_by: string;
  moved_by_name: string;
  note: string;
  shift_id: string;
}
