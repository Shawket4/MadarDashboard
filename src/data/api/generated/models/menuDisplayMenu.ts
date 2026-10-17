/* eslint-disable */
// @ts-nocheck
import type { DeliveryMenuCategory } from './deliveryMenuCategory';
import type { MenuDisplayAddon } from './menuDisplayAddon';
import type { MenuDisplayItem } from './menuDisplayItem';

export interface MenuDisplayMenu {
  addons: MenuDisplayAddon[];
  /** In the POS's order. */
  categories: DeliveryMenuCategory[];
  items: MenuDisplayItem[];
}
