/* eslint-disable */
// @ts-nocheck
import type { LedgerEntry } from './ledgerEntry';
import type { MemberView } from './memberView';
import type { RewardItem } from './rewardItem';

/**
 * What the teller's scan screen shows.
 */
export interface ScanResult {
  /**
     * The whole menu is claimable, not just `rewards`.
     *
     * When on, `rewards` stops being the list of what MAY be claimed — it is
     * only what happens to be curated — and the till offers every line at
     * `any_item_cost`. Sent rather than inferred, because a till cannot tell
     * "no catalogue" apart from "any item" without being told.
     */
  any_item: boolean;
  /** What one line costs when `any_item` is on, in the branch's currency. */
  any_item_cost: number;
  member: MemberView;
  /** Recent history, so a teller can answer "where did my points go?". */
  recent: LedgerEntry[];
  /**
     * What this member could claim at this branch right now. Empty until the
     * balance reaches the threshold, so the screen cannot tempt a teller into
     * handing over a reward that has not been earned.
     */
  rewards: RewardItem[];
}
