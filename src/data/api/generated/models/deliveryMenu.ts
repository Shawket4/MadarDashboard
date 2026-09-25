/* eslint-disable */
// @ts-nocheck
import type { DealRule } from './dealRule';
import type { DeliveryAddonOption } from './deliveryAddonOption';
import type { DeliveryMenuCategory } from './deliveryMenuCategory';
import type { DeliveryMenuDiscount } from './deliveryMenuDiscount';
import type { DeliveryMenuItem } from './deliveryMenuItem';

export interface DeliveryMenu {
  /**
     * Org-wide addon catalog (global, POS model): channel-effective, grouped by
     * `type`, applicable to every item. Channel-unavailable options are excluded.
     */
  addons: DeliveryAddonOption[];
  categories: DeliveryMenuCategory[];
  /**
     * The deals on offer on this channel now (§11.2): checkout applies the
     * best ones automatically (`POST …/cart-quote` shows them). Additive.
     */
  deals: DealRule[];
  discount?: null | DeliveryMenuDiscount;
  items: DeliveryMenuItem[];
}
