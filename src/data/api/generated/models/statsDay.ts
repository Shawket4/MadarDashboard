/* eslint-disable */
// @ts-nocheck

export interface StatsDay {
  /** Members with any ledger row that day. */
  active: number;
  date: string;
  /** Stamps (or points) earned, every track. */
  earned: number;
  new_members: number;
  /** Rewards taken (redemption rows), every track. */
  redemptions: number;
}
