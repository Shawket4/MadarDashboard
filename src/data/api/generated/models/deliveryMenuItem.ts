/* eslint-disable */
// @ts-nocheck
import type { DeliveryMenuItemNameTranslations } from './deliveryMenuItemNameTranslations';
import type { DeliveryMenuSize } from './deliveryMenuSize';
import type { DeliveryOptionalField } from './deliveryOptionalField';

export interface DeliveryMenuItem {
  /** @nullable */
  category_id?: string | null;
  /**
     * The item's base/default milk: the `milk_type` addon whose ingredient
   * matches the item recipe's milk ingredient. The online customizer
   * pre-selects it (mirrors the POS default-milk selection). `None` when the
   * item has no milk in its recipe or no matching milk addon exists.
     * @nullable
     */
  default_milk_addon_id?: string | null;
  /** @nullable */
  description?: string | null;
  id: string;
  /** @nullable */
  image_url?: string | null;
  name: string;
  name_translations: DeliveryMenuItemNameTranslations;
  optionals: DeliveryOptionalField[];
  price: number;
  sizes: DeliveryMenuSize[];
}
