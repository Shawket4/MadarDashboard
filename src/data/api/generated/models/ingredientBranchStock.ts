/* eslint-disable */
// @ts-nocheck

/**
 * Non-zero book stock of the ingredient at one branch.
 */
export interface IngredientBranchStock {
  branch_id: string;
  branch_name: string;
  /** In the ingredient's base unit; may be negative. */
  on_hand: number;
}
