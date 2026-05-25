/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface PreviewIngredient {
  category: string;
  ingredient_name: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity: number;
  source: string;
  unit: string;
}
