/* eslint-disable */
// @ts-nocheck

export interface StocktakeItem {
  /**
     * The baseline the difference is measured against: live book stock while
     * the count is open, frozen at finalize.
     */
  book_qty: number;
  category_id: string;
  category_name: string;
  /** @nullable */
  counted_by?: string | null;
  /** @nullable */
  counted_qty?: number | null;
  created_at: string;
  id: string;
  ingredient_name: string;
  /**
     * True when the branch had no stock activity for this ingredient when the
     * count opened — counting it is what starts tracking it here.
     */
  is_new: boolean;
  /** @nullable */
  note?: string | null;
  /** Book stock when the count was opened (reference only). */
  opening_qty: number;
  org_ingredient_id: string;
  stocktake_id: string;
  unit: string;
  /**
     * Piastres per unit snapshot; `null` ⟺ unknown.
     * @nullable
     */
  unit_cost?: number | null;
  /**
     * counted − book; `null` until counted.
     * @nullable
     */
  variance?: number | null;
  /**
     * theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.
     * @nullable
     */
  variance_reason?: string | null;
}
