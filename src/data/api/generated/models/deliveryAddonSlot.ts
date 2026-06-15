/* eslint-disable */
// @ts-nocheck
import type { DeliveryAddonOption } from './deliveryAddonOption';
import type { DeliveryAddonSlotNameTranslations } from './deliveryAddonSlotNameTranslations';

/**
 * A customization slot on a menu item (e.g. "Milk Type", "Add-ons"). `group_id`
 * is the addon-type the slot draws its options from; the options are every
 * channel-available addon item of that type in the org.
 */
export interface DeliveryAddonSlot {
  addons: DeliveryAddonOption[];
  /** The addon group/type key this slot offers (`milk_type`/`coffee_type`/`extra`). */
  group_id: string;
  id: string;
  /** @nullable */
  max_select?: number | null;
  min_select: number;
  /** @nullable */
  name?: string | null;
  name_translations: DeliveryAddonSlotNameTranslations;
  required: boolean;
}
