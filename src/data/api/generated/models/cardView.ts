/* eslint-disable */
// @ts-nocheck
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
  can_redeem: boolean;
  member_token: string;
  mode: string;
  name: string;
  next_reward_cost: number;
  passes: PassLinks;
  points_to_next_reward: number;
  program_name: string;
  rewards: PublicReward[];
}
