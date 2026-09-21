/* eslint-disable */
// @ts-nocheck

/**
 * One line of a base, stored in the ingredient's base unit.
 */
export interface RecipeBaseLineOut {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  /** Base-unit quantity as a string (numeric fidelity). */
  quantity: string;
  /**
     * `null` = applies to every size; else only to sizes with this exact label (and
     * wins over a `null` line for the same ingredient).
     * @nullable
     */
  size_label?: string | null;
  sort: number;
  unit: string;
}
