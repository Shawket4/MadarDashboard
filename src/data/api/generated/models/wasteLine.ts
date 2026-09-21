/* eslint-disable */
// @ts-nocheck

/**
 * One ingredient line of a recorded waste.
 */
export interface WasteLine {
  balance_after: number;
  below_zero: boolean;
  ingredient_name: string;
  movement_id: string;
  org_ingredient_id: string;
  /** Signed ledger delta (negative), in the ingredient's unit. */
  quantity: number;
  unit: string;
  /**
     * Piastres per unit; `null` = unknown.
     * @nullable
     */
  unit_cost?: number | null;
}
