/* eslint-disable */
// @ts-nocheck
import type { Wallet } from './wallet';

/**
 * One rule.
 */
export type Rule = {
  /** @minimum 0 */
  track: number;
  type: 'balance_at_least';
  value: number;
} | {
  /** @minimum 0 */
  track: number;
  type: 'balance_at_most';
  value: number;
} | {
  /** @minimum 0 */
  track: number;
  type: 'reward_ready';
} | {
  /** @minimum 0 */
  days: number;
  type: 'visited_within';
} | {
  /** @minimum 0 */
  days: number;
  type: 'not_visited_for';
} | {
  /** @minimum 0 */
  days: number;
  type: 'joined_within';
} | {
  /** @minimum 0 */
  month: number;
  type: 'birthday_month';
} | {
  type: 'has_wallet';
  wallet: Wallet;
};
