/* eslint-disable */
// @ts-nocheck
import type { StatsDay } from './statsDay';
import type { StatsTrack } from './statsTrack';

export interface RewardsStats {
  active_members: number;
  daily: StatsDay[];
  earned: number;
  from: string;
  members_total: number;
  /** Members holding the card in a wallet (Apple device or Google object). */
  members_with_card: number;
  messages_seen: number;
  messages_sent: number;
  /** `points` or `visits`. */
  mode: string;
  new_members: number;
  per_track: StatsTrack[];
  redemptions: number;
  to: string;
}
