/* eslint-disable */
// @ts-nocheck

export interface ReceiveLineInput {
  /**
     * Optional ACTUAL invoice total (piastres) for what this delivery brought,
     * when it differs from the ordered price. Preferred over `unit_cost`.
     * Drives weighted-average cost + the ledger; omitted (with `unit_cost`)
     * ⟹ the ordered line total, pro rata to the quantity received.
     * @nullable
     */
  line_cost?: number | null;
  line_id: string;
  quantity_received: number;
  /**
     * Optional ACTUAL invoice cost in piastres per purchase unit (older
     * clients). Ignored when `line_cost` is sent.
     * @nullable
     */
  unit_cost?: number | null;
}
