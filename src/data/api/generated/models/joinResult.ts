/* eslint-disable */
// @ts-nocheck
import type { PassLinks } from './passLinks';

/**
 * What the customer sees after signing up: their card, and the buttons.
 */
export interface JoinResult {
  /**
     * True when this phone was already a member — the page says "welcome back"
     * and shows the existing card rather than pretending to have made a new one.
     */
  already_member: boolean;
  /** The live balance, in `mode`'s currency. Zero for a fresh member. */
  balance: number;
  member_token: string;
  mode: string;
  name: string;
  next_reward_cost: number;
  passes: PassLinks;
  program_name: string;
}
