/* eslint-disable */
// @ts-nocheck
import type { DeliveryAddonOption } from './deliveryAddonOption';
import type { DeliveryMenuCategory } from './deliveryMenuCategory';
import type { DeliveryMenuItem } from './deliveryMenuItem';

export interface DeliveryMenu {
  /** Org-wide addon catalog (global, POS model): channel-effective, grouped by
   * `type`, applicable to every item. Channel-unavailable options are excluded. */
  addons: DeliveryAddonOption[];
  categories: DeliveryMenuCategory[];
  items: DeliveryMenuItem[];
}
