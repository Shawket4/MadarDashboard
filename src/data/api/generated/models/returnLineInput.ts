/* eslint-disable */
// @ts-nocheck

export interface ReturnLineInput {
  org_ingredient_id: string;
  /** Base stock units to return (must be ≤ on hand). */
  quantity: number;
  /**
     * Piastres per base stock unit; defaults to the branch's actual cost.
     * @nullable
     */
  unit_cost?: number | null;
}
