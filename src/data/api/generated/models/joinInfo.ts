/* eslint-disable */
// @ts-nocheck
import type { CardBrand } from './cardBrand';
import type { PublicReward } from './publicReward';

/**
 * What the signup page needs to render itself before anyone types anything.
 */
export interface JoinInfo {
  /**
     * Ask for a date of birth. False means the form does not show the field —
     * a shop that does not run birthday rewards is not given one to hold.
     */
  birthday_enabled: boolean;
  /**
     * What the birthday is worth here, so the page can say what it is FOR
     * rather than asking for a date of birth and explaining nothing.
     * @nullable
     */
  birthday_reward_amount?: number | null;
  /**
     * Absent for an org-wide code — the customer has not told us where they
     * are, and nothing in the programme needs to know.
     * @nullable
     */
  branch_id?: string | null;
  /** @nullable */
  branch_name?: string | null;
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
