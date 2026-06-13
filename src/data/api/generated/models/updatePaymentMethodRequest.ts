/* eslint-disable */
// @ts-nocheck
import type { UpdatePaymentMethodRequestLabelTranslations } from './updatePaymentMethodRequestLabelTranslations';

export interface UpdatePaymentMethodRequest {
  /** @nullable */
  color?: string | null;
  /** @nullable */
  icon?: string | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  is_cash?: boolean | null;
  /** @nullable */
  label_translations?: UpdatePaymentMethodRequestLabelTranslations;
  /** @nullable */
  name?: string | null;
}
