/* eslint-disable */
// @ts-nocheck

export interface GoodsReceiptLine {
  id: string;
  ingredient_name: string;
  org_ingredient_id: string;
  /** @nullable */
  purchase_order_line_id?: string | null;
  /** Base stock units received (+) or returned (−). */
  quantity: number;
  /**
     * Piastres per base stock unit (actual).
     * @nullable
     */
  unit_cost?: number | null;
}
