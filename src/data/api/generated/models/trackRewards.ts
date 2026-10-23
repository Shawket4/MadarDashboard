/* eslint-disable */
// @ts-nocheck
import type { RewardItem } from './rewardItem';

/**
 * What a track 2–4 offers at the till: each of its items at the track's size.
 */
export interface TrackRewards {
  /** @minimum 0 */
  position: number;
  /**
     * Only what the member's balance on this track can buy now (as
     * `ScanResult.rewards` is for track 1).
     */
  rewards: RewardItem[];
}
