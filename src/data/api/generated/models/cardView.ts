/* eslint-disable */
// @ts-nocheck
import type { CardBrand } from './cardBrand';
import type { PassLinks } from './passLinks';
import type { PublicReward } from './publicReward';

/**
 * The member's own card page — what they see when they open the link again.
 *
 * The token in the path is the member's secret, which is why this returns only
 * what the pass already shows and never the phone number in full.
 */
export interface CardView {
  /** The live balance, in `mode`'s currency. */
  balance: number;
  /** Whose card this is, and how it should look. */
  brand: CardBrand;
  can_redeem: boolean;
  /** They have asked this shop to stop sending them things. */
  marketing_opt_out: boolean;
  member_token: string;
  mode: string;
  name: string;
  next_reward_cost: number;
  passes: PassLinks;
  points_to_next_reward: number;
  /** Progress towards the next one, after the earned ones are set aside. */
  progress_to_next: number;
  rewards: PublicReward[];
  /** Rewards the balance has already earned — a card does not stop at full. */
  rewards_ready: number;
}
