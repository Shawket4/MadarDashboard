/* eslint-disable */
// @ts-nocheck

export interface ReceiveLineInput {
  line_id: string;
  quantity_received: number;
  /**
     * Optional ACTUAL invoice cost (piastres per purchase unit) for this
     * delivery, when it differs from the ordered price. Drives weighted-average
     * cost + the ledger; omitted ⟹ the PO line's ordered cost is used.
     * @nullable
     */
  unit_cost?: number | null;
}
