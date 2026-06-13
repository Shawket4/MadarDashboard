/* eslint-disable */
// @ts-nocheck

export interface ShrinkageRow {
  ingredient_name: string;
  org_ingredient_id: string;
  /** The variance reason captured at finalize, or `unexplained` when none. */
  reason: string;
  /** Quantity lost (positive number) from negative stock-count differences. */
  shrinkage_qty: number;
  /**
     * Valued shrinkage in piastres; `null` when any contributing cost unknown.
     * @nullable
     */
  shrinkage_value?: number | null;
  unit: string;
}
