/* eslint-disable */
// @ts-nocheck
import type { CardBrand } from './cardBrand';
import type { PublicReward } from './publicReward';

/**
 * What the signup page needs to render itself before anyone types anything.
 */
export interface JoinInfo {
  branch_id: string;
  branch_name: string;
  /** Whose programme this is, and how the page should look. */
  brand: CardBrand;
  /**
     * EGP that earns one point — the page's "a point for every N EGP" line.
     * Piastres on the wire, as everywhere; the page divides by 100. Only
     * meaningful when `mode` is `"points"`.
     */
  earn_piastres_per_point: number;
  /**
     * False when the program is off here — the page says so instead of taking
     * a signup that would go nowhere.
     */
  enabled: boolean;
  /**
     * `"points"` (earned on spend) or `"visits"` (a stamp per order) — which
     * sentence the page writes.
     */
  mode: string;
  /** The cheapest reward on offer, in `mode`'s currency. */
  next_reward_cost: number;
  /** The page collects an OTP only when the branch asks for one. */
  require_otp: boolean;
  /** The rewards on offer, each with what it costs. */
  rewards: PublicReward[];
  /** @nullable */
  terms?: string | null;
  /** @nullable */
  terms_ar?: string | null;
}
