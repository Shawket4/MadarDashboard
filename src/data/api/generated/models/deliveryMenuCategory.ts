/* eslint-disable */
// @ts-nocheck
import type { DeliveryMenuCategoryNameTranslations } from './deliveryMenuCategoryNameTranslations';

export interface DeliveryMenuCategory {
  /**
     * The dashboard's drag-and-drop position (lower first). `categories`
     * already comes in the POS's order (madar-catalog `order`: this, then
     * the English name, then `id`); a page shown in another language
     * re-orders by the name it shows (madar-web `category_order`).
     */
  display_order: number;
  id: string;
  /** @nullable */
  image_url?: string | null;
  name: string;
  name_translations: DeliveryMenuCategoryNameTranslations;
}
