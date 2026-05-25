/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface UpsertAddonIngredientRequest {
  ingredient_name: string;
  ingredient_unit: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity_used: number;
}
