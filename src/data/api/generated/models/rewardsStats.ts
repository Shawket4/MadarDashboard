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
  /** Messages that reached a card or WhatsApp (not "no card, no WhatsApp"). */
  messages_sent: number;
  /** `points` or `visits`. */
  mode: string;
  new_members: number;
  per_track: StatsTrack[];
  redemptions: number;
  /** What track 1 counts: `points`, `order`, `item` or `stamp` (tracks 2–4 count stamps). */
  stamp_unit: string;
  to: string;
}
