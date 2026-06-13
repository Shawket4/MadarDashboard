/* eslint-disable */
// @ts-nocheck
import type { Action } from './action';
import type { Classification } from './classification';
import type { Confidence } from './confidence';
import type { GuardClip } from './guardClip';
import type { ItemKey } from './itemKey';
import type { PeerComparison } from './peerComparison';
import type { PriceAnchors } from './priceAnchors';

export interface PriceSuggestion {
  action: Action;
  anchors: PriceAnchors;
  classification: Classification;
  /** @nullable */
  cm_per_unit?: number | null;
  confidence: Confidence;
  /** True when cost data is unavailable for this item. Mirrors
   * `classification` mode, exposed flat for UI badge rendering. */
  cost_missing: boolean;
  /**
     * Only computed for CM-tracked Plowhorses.
     * @nullable
     */
  cost_reduction_whatif_margin?: number | null;
  current_price: number;
  effective_price: number;
  explanation: string;
  /** @nullable */
  food_cost_pct?: number | null;
  guard_clips: GuardClip[];
  item_name: string;
  key: ItemKey;
  /** @nullable */
  margin_pct?: number | null;
  peer_comparison?: null | PeerComparison;
  popularity_share: number;
  price_changed_in_window: boolean;
  /** @nullable */
  suggested_delta_abs?: number | null;
  /** @nullable */
  suggested_delta_pct?: number | null;
  /** @nullable */
  suggested_price?: number | null;
  units_sold_raw: number;
}
