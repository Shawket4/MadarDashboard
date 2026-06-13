/* eslint-disable */
// @ts-nocheck

export interface StocktakeItem {
  /** @nullable */
  branch_inventory_id?: string | null;
  /** @nullable */
  counted_by?: string | null;
  /** @nullable */
  counted_qty?: number | null;
  created_at: string;
  expected_qty: number;
  id: string;
  ingredient_name: string;
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  stocktake_id: string;
  unit: string;
  /**
     * Piastres per unit snapshot; `null` ⟺ unknown.
     * @nullable
     */
  unit_cost?: number | null;
  /** @nullable */
  variance?: number | null;
  /**
     * theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.
     * @nullable
     */
  variance_reason?: string | null;
}
