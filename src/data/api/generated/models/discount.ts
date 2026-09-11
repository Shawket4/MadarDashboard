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
     * Polymorphic by `dtype`: a FRACTION for `percentage` (0.14 = 14%, like
     * every other rate in this schema), or minor units for `fixed`.
     */
  value: number;
}
