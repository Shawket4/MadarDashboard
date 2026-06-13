/* eslint-disable */
// @ts-nocheck
import type { BundleAssociation } from './bundleAssociation';
import type { BundleForecast } from './bundleForecast';
import type { GuardClip } from './guardClip';
import type { ItemKey } from './itemKey';

export interface BundleSuggestion {
  association: BundleAssociation;
  /** @nullable */
  bundle_cm?: number | null;
  /**
     * All cost-derived fields are `None` when any component lacks cost data.
     * @nullable
     */
  bundle_cost?: number | null;
  bundle_discount_pct: number;
  bundle_items: ItemKey[];
  bundle_list_price: number;
  /** @nullable */
  bundle_margin_pct?: number | null;
  bundle_suggested_price: number;
  explanation: string;
  focus_item: ItemKey;
  forecast: BundleForecast;
  guard_clips: GuardClip[];
  /** True ⟺ at least one component is cost-missing. */
  missing_costs: boolean;
}
