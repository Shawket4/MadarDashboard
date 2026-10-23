/* eslint-disable */
// @ts-nocheck
import type { MemberView } from './memberView';
import type { TrackAward } from './trackAward';

export interface AwardResult {
  /**
     * True when this order had already earned — a double tap, a retry, or a
     * replayed offline op. Not an error: the outcome is the one that was asked
     * for, and the response carries the balance that resulted.
     */
  already_awarded: boolean;
  member: MemberView;
  order_id: string;
  /** Points this sale earned. 0 when it was too small to reach one point. */
  points_awarded: number;
  /**
     * What each stamp track 2–4 earned on this press (0 for one already
     * earned), when the card has more than one track. `points_awarded` and
     * `member` stay track 1's.
     * @nullable
     */
  tracks?: TrackAward[] | null;
}
