/* eslint-disable */
// @ts-nocheck

export interface VarianceRow {
  /** @nullable */
  counted_qty?: number | null;
  expected_qty: number;
  ingredient_name: string;
  /** True when |difference| exceeds the org threshold (or appears/vanishes from zero). */
  is_flagged: boolean;
  org_ingredient_id: string;
  unit: string;
  /** @nullable */
  unit_cost?: number | null;
  /** @nullable */
  variance?: number | null;
  /**
     * theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.
     * @nullable
     */
  variance_reason?: string | null;
  /**
     * variance × unit_cost in piastres; `null` when cost unknown.
     * @nullable
     */
  variance_value?: number | null;
}
