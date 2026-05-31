/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { CreatePaymentMethodRequestLabelTranslations } from './createPaymentMethodRequestLabelTranslations';

export interface CreatePaymentMethodRequest {
  color: string;
  /** @nullable */
  display_order?: number | null;
  icon: string;
  /** @nullable */
  is_active?: boolean | null;
  is_cash: boolean;
  label_translations: CreatePaymentMethodRequestLabelTranslations;
  name: string;
}
