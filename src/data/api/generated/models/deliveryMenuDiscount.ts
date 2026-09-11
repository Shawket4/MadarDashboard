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
  /**
     * A FRACTION for `percentage` (0.14 = 14%, like every other rate here);
     * piastres for `fixed`.
     */
  value: number;
}
