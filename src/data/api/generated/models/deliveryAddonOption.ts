/* eslint-disable */
// @ts-nocheck
import type { DeliveryAddonOptionNameTranslations } from './deliveryAddonOptionNameTranslations';

/**
 * One option in the org-wide addon catalog. The catalog is global (the POS
 * model): every item can use any addon; swap-vs-additive is decided server-side
 * from the addon `type` + the item recipe at order time. `price` is the
 * channel-effective surcharge in piastres (branch_channel → branch → catalog
 * default). Channel-unavailable options are excluded from the catalog entirely.
 */
export interface DeliveryAddonOption {
  addon_item_id: string;
  is_available: boolean;
  name: string;
  name_translations: DeliveryAddonOptionNameTranslations;
  /** Channel-effective surcharge (piastres). Always present (resolved here). */
  price: number;
  /** `milk_type` | `coffee_type` | `extra` — the option's category. */
  type: string;
}
