/* eslint-disable */
// @ts-nocheck
import type { PriceRoundingRule } from './priceRoundingRule';

/**
 * `#[serde(default)]` lets clients send partial configs; missing fields
 * take the values below. Output serialization is unaffected.
 */
export interface AnalysisConfig {
  analysis_window_days?: number;
  bundle_discount_pct_range?: [number, number];
  /** @minimum 0 */
  bundle_max_size?: number;
  /** @minimum 0 */
  bundle_top_k_partners?: number;
  /** @minimum 0 */
  bundle_top_n_per_focus?: number;
  halo_repeat_rate?: number;
  max_price_change_pct_per_cycle?: number;
  min_cooccurrences_for_bundle?: number;
  min_gross_margin_pct?: number;
  min_lift_for_bundle?: number;
  min_units_for_classification?: number;
  price_rounding_rule?: PriceRoundingRule;
  promotion_lift_prior?: number;
  recency_half_life_days?: number;
  /** Conservative max-raise cap for revenue-only items (no margin floor to
   * guard against). */
  revenue_mode_max_raise_pct?: number;
  target_food_cost_pct?: number;
}
