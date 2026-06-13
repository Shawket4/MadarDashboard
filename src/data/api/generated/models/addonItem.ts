/* eslint-disable */
// @ts-nocheck
import type { AddonItemIngredient } from './addonItemIngredient';
import type { AddonItemNameTranslations } from './addonItemNameTranslations';

export interface AddonItem {
  addon_type: string;
  created_at: string;
  default_price: number;
  id: string;
  ingredients?: AddonItemIngredient[];
  is_active: boolean;
  name: string;
  name_translations: AddonItemNameTranslations;
  org_id: string;
  /** @nullable */
  primary_ingredient_id?: string | null;
  updated_at: string;
}
