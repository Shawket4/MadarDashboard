/* eslint-disable */
// @ts-nocheck

export interface VarianceRow {
  /** Book stock the difference is measured against (at finalize). */
  book_qty: number;
  category_name: string;
  /** @nullable */
  counted_qty?: number | null;
  ingredient_name: string;
  /** True when |difference| exceeds the org threshold (or appears/vanishes from zero). */
  is_flagged: boolean;
  /** Book stock when the count opened. */
  opening_qty: number;
  org_ingredient_id: string;
  unit: string;
  /** @nullable */
  unit_cost?: number | null;
  /**
     * counted − book.
     * @nullable
     */
  variance?: number | null;
  /** @nullable */
  variance_reason?: string | null;
  /**
     * variance × unit_cost in piastres; `null` when cost unknown.
     * @nullable
     */
  variance_value?: number | null;
}
