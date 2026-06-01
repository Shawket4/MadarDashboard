/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
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
  value: number;
}
