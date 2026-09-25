/* eslint-disable */
// @ts-nocheck
import type { ChannelToggles } from './channelToggles';
import type { DealBranchOverride } from './dealBranchOverride';
import type { DealPoolEntry } from './dealPoolEntry';
import type { DealRuleNameTranslations } from './dealRuleNameTranslations';
import type { SaleWindow } from './saleWindow';

/**
 * A deal rule. `n_for_price`: any `qty` units of the pool for `price`.
 * `buy_get`: buy `qty`, get `get_qty` at `get_percent`% off (100 = free),
 * the rewarded units drawn from `reward_pool` (or the pool when empty).
 * A deal covers the item's size price only; add-ons always pay.
 *
 * Also the `deal_rule` feed row of `/sync/pull`, where `is_active` is
 * resolved for the device's branch and `sell` carries the branch's channel
 * toggles.
 */
export interface DealRule {
  branch_overrides: DealBranchOverride[];
  created_at: string;
  /** @nullable */
  get_percent?: number | null;
  /** @nullable */
  get_qty?: number | null;
  id: string;
  is_active: boolean;
  /** `n_for_price` | `buy_get`. */
  kind: string;
  /** @nullable */
  max_per_order?: number | null;
  name: string;
  name_translations: DealRuleNameTranslations;
  pool: DealPoolEntry[];
  /**
     * n_for_price: the price of `qty` units, piastres.
     * @nullable
     */
  price?: number | null;
  qty: number;
  /** buy_get only; `[]` = the rewarded units come from `pool`. */
  reward_pool: DealPoolEntry[];
  sell?: null | ChannelToggles;
  sort: number;
  updated_at: string;
  windows: SaleWindow[];
}
