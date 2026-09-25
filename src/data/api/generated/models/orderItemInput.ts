/* eslint-disable */
// @ts-nocheck
import type { AddonInput } from './addonInput';
import type { ComboInput } from './comboInput';
import type { StaffDrinkLine } from './staffDrinkLine';

export interface OrderItemInput {
  addons?: AddonInput[];
  combo?: null | ComboInput;
  /** @nullable */
  menu_item_id?: string | null;
  /** @nullable */
  notes?: string | null;
  optional_field_ids?: string[];
  quantity: number;
  /** @nullable */
  size_label?: string | null;
  staff_drink?: null | StaffDrinkLine;
  /**
     * What the customer was actually charged, in piastres.
     *
     * Read ONLY when a queued offline sale is replayed — see [`ClientPrices`].
     * On the live path the server prices the line and this is ignored, so a
     * till cannot charge a price of its own choosing and no manual override
     * exists to let anyone try.
     * @nullable
     */
  unit_price?: number | null;
}
