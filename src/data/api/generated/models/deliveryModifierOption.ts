/* eslint-disable */
// @ts-nocheck
import type { DeliveryModifierOptionNameTranslations } from './deliveryModifierOptionNameTranslations';

/**
 * One option inside a per-item modifier group. `option_id` is the STABLE id —
 * it equals the legacy `addon_item_id`, so order intake accepts it unchanged in
 * `addons[].addon_item_id` (menu-unification stable-id rule).
 */
export interface DeliveryModifierOption {
  name: string;
  name_translations: DeliveryModifierOptionNameTranslations;
  option_id: string;
  /** Channel-effective surcharge (piastres): branch_channel → branch →
   * channel → catalog default. Unavailable options are excluded entirely. */
  price: number;
}
