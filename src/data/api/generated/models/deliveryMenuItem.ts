/* eslint-disable */
// @ts-nocheck
import type { DeliveryMenuItemNameTranslations } from './deliveryMenuItemNameTranslations';
import type { DeliveryMenuSize } from './deliveryMenuSize';
import type { DeliveryModifierGroup } from './deliveryModifierGroup';
import type { DeliveryOptionalField } from './deliveryOptionalField';

export interface DeliveryMenuItem {
  /**
     * Explicit per-item addon allowlist (IDs from `menu_item_allowed_addons`).
     * When non-empty the customizer filters the global catalog to these IDs by
     * default, with a "show all" escape hatch. Empty = no restriction.
     */
  allowed_addon_ids: string[];
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
  /**
     * The item's modifier groups (unified model), channel-effective. Empty ⇒
     * the customizer falls back to `addons` + `allowed_addon_ids`.
     */
  modifier_groups: DeliveryModifierGroup[];
  name: string;
  name_translations: DeliveryMenuItemNameTranslations;
  optionals: DeliveryOptionalField[];
  price: number;
  sizes: DeliveryMenuSize[];
}
