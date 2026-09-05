/* eslint-disable */
// @ts-nocheck

/**
 * One catalog ingredient as seen from a branch. Every live catalog ingredient
 * appears exactly once; `has_activity = false` means the branch has never
 * moved or counted it (on hand is 0 and every date is null).
 */
export interface BranchStockRow {
  below_par: boolean;
  branch_id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  /**
     * This branch's actual (weighted-average) cost, falling back to the org
     * standard cost. Piastres per unit; `null` ⟺ unknown.
     * @nullable
     */
  cost_per_unit?: number | null;
  /** @nullable */
  description?: string | null;
  has_activity: boolean;
  ingredient_name: string;
  /**
     * Last finalized stock count that included this ingredient; `null` = never.
     * @nullable
     */
  last_counted_at?: string | null;
  /**
     * Last ledger movement of any kind; `null` = never.
     * @nullable
     */
  last_movement_at?: string | null;
  /** Book stock in the base unit. May be negative (sold past zero, flagged). */
  on_hand: number;
  org_ingredient_id: string;
  /**
     * Order-up-to level for reorder suggestions.
     * @nullable
     */
  par_max?: number | null;
  /**
     * Reorder point: below-par when `on_hand <= par_min` and `par_min > 0`.
     * @nullable
     */
  par_min?: number | null;
  unit: string;
}
