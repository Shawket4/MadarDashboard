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
  created_at: string;
  id: string;
  moved_by: string;
  moved_by_name: string;
  note: string;
  shift_id: string;
}
