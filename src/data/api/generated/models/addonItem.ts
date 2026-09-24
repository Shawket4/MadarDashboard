/* eslint-disable */
// @ts-nocheck
import type { AddonItemIngredient } from './addonItemIngredient';
import type { AddonItemNameTranslations } from './addonItemNameTranslations';
import type { AddonItemPricing } from './addonItemPricing';

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
  /**
     * How a sale line charges this option: madar-catalog's `OptionView`
     * (branch-effective price, its group's effect and swap category, the
     * ingredient it replaces, its lines per size). The till prices lines with
     * it exactly as the order path does. Additive; older tills ignore it.
     * @nullable
     */
  pricing?: AddonItemPricing;
  /** @nullable */
  primary_ingredient_id?: string | null;
  updated_at: string;
}
