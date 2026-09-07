/* eslint-disable */
// @ts-nocheck
import type { RewardItemInput } from './rewardItemInput';

export interface PutRewardItems {
  /** @nullable */
  branch_id?: string | null;
  /**
     * The complete list for this scope, in order. An empty list clears the
     * scope — for a branch that means going back to inheriting the org's.
     */
  items: RewardItemInput[];
}
