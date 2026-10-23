/* eslint-disable */
// @ts-nocheck
import type { Broadcast } from './broadcast';
import type { Limits } from './limits';

export interface BroadcastsPage {
  items: Broadcast[];
  limits: Limits;
  /** Broadcasts in the last 24 hours (cancelled ones excluded), against `limits.daily_limit`. */
  sent_last_24h: number;
  total: number;
}
