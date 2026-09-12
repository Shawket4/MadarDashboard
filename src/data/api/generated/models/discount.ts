/* eslint-disable */
// @ts-nocheck
import type { DiscountNameTranslations } from './discountNameTranslations';

export interface Discount {
  created_at: string;
  dtype: string;
  id: string;
  is_active: boolean;
  name: string;
  name_translations: DiscountNameTranslations;
  org_id: string;
  updated_at: string;
  /**
     * LEGACY SPELLING — an integer, 0-100 for a percentage, minor units for
     * `fixed`. What every shipped client was generated against; see
     * `discounts::wire`. Read [`Discount::value_rate`] for the real stored
     * number.
     */
  value: number;
  /**
     * The stored value: a FRACTION for `percentage` (0.14 = 14%, like every
     * other rate in this schema), or minor units for `fixed`. The same
     * column as [`Discount::value`], spelled the way the engine holds it.
     */
  value_rate?: number;
}
