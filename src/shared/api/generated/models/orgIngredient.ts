/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface OrgIngredient {
  category: string;
  cost_per_unit: number;
  created_at: string;
  /** @nullable */
  description?: string | null;
  id: string;
  is_active: boolean;
  name: string;
  org_id: string;
  unit: string;
  updated_at: string;
}
