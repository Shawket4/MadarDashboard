/* eslint-disable */
// @ts-nocheck
import type { RewardItem } from './rewardItem';

export interface RewardCatalogue {
  /** @nullable */
  branch_id?: string | null;
  /** True when these rows are the org default rather than this branch's own. */
  inherited: boolean;
  items: RewardItem[];
  org_id: string;
}
