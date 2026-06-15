/* eslint-disable */
// @ts-nocheck
import type { DeliveryOptionalFieldNameTranslations } from './deliveryOptionalFieldNameTranslations';

/**
 * A per-item optional toggle (e.g. "Extra hot", "No sugar"). `price` is the
 * piastres surcharge; `size_label` is set when the optional only applies to a
 * specific size.
 */
export interface DeliveryOptionalField {
  id: string;
  name: string;
  name_translations: DeliveryOptionalFieldNameTranslations;
  price: number;
  /** @nullable */
  size_label?: string | null;
}
