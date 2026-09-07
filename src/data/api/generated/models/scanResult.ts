/* eslint-disable */
// @ts-nocheck
import type { LedgerEntry } from './ledgerEntry';
import type { MemberView } from './memberView';
import type { RewardItem } from './rewardItem';

/**
 * What the teller's scan screen shows.
 */
export interface ScanResult {
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
