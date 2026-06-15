/* eslint-disable */
// @ts-nocheck
import type { DeliveryMenuCategoryNameTranslations } from './deliveryMenuCategoryNameTranslations';

export interface DeliveryMenuCategory {
  id: string;
  /** @nullable */
  image_url?: string | null;
  name: string;
  name_translations: DeliveryMenuCategoryNameTranslations;
}
