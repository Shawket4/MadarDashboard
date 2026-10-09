/* eslint-disable */
// @ts-nocheck

export interface StockTransferLine {
  id: string;
  ingredient_name: string;
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  /**
     * `None` until received.
     * @nullable
     */
  qty_received?: number | null;
  /** Asked for while `requested`, planned while `draft`, sent from dispatch on. */
  qty_sent: number;
  unit: string;
  /**
     * Frozen at dispatch from the source's cost; `None` before dispatch or unknown.
     * @nullable
     */
  unit_cost?: number | null;
}
