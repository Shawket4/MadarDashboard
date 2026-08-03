/* eslint-disable */
// @ts-nocheck
import type { CreatePaymentMethodRequestLabelTranslations } from './createPaymentMethodRequestLabelTranslations';

export interface CreatePaymentMethodRequest {
  color: string;
  icon: string;
  /** @nullable */
  is_active?: boolean | null;
  is_cash: boolean;
  label_translations: CreatePaymentMethodRequestLabelTranslations;
  name: string;
  /**
     * Defaults to true — see [`OrgPaymentMethod::visible_in_integrations`].
     * @nullable
     */
  visible_in_integrations?: boolean | null;
}
