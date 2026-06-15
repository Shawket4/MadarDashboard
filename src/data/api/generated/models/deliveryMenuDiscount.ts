/* eslint-disable */
// @ts-nocheck
import type { DeliveryMenuDiscountNameTranslations } from './deliveryMenuDiscountNameTranslations';

/**
 * Customer-facing summary of a channel's active discount, so the public UI can
 * tell the customer "you've got X off" and show a discounted estimate.
 */
export interface DeliveryMenuDiscount {
  /** "percentage" | "fixed". */
  dtype: string;
  id: string;
  name: string;
  name_translations: DeliveryMenuDiscountNameTranslations;
  /** Percentage points (0-100) for `percentage`; piastres for `fixed`. */
  value: number;
}
