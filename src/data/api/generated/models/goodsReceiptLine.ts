/* eslint-disable */
// @ts-nocheck

export interface GoodsReceiptLine {
  id: string;
  ingredient_name: string;
  /**
     * Piastres this delivery cost (negative for a return); null when unknown.
     * @nullable
     */
  line_cost?: number | null;
  org_ingredient_id: string;
  /** @nullable */
  purchase_order_line_id?: string | null;
  /** Base stock units received (+) or returned (−). */
  quantity: number;
  /**
     * Piastres per base stock unit (actual), rounded to whole piastres.
     * @nullable
     */
  unit_cost?: number | null;
  /**
     * Piastres per base stock unit at full precision.
     * @nullable
     */
  unit_cost_exact?: number | null;
}
