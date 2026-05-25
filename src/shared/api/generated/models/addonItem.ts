/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { AddonItemIngredient } from './addonItemIngredient';

export interface AddonItem {
  addon_type: string;
  created_at: string;
  default_price: number;
  display_order: number;
  id: string;
  ingredients?: AddonItemIngredient[];
  is_active: boolean;
  name: string;
  org_id: string;
  /** @nullable */
  primary_ingredient_id?: string | null;
  updated_at: string;
}
