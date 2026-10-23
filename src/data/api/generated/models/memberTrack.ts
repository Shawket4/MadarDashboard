/* eslint-disable */
// @ts-nocheck

/**
 * One track on a member's card, with the card's figures (madar-card's
 * `track_card`). Track 1's figures equal the member's top-level ones.
 */
export interface MemberTrack {
  balance: number;
  can_redeem: boolean;
  /** @nullable */
  colour?: string | null;
  /**
     * The track is bound to menu items (a POS sale earns it); `false` = a
     * counter-only track.
     */
  earns_from_sales?: boolean;
  name_ar: string;
  name_en: string;
  points_to_next_reward: number;
  /** @minimum 0 */
  position: number;
  progress_to_next: number;
  rewards_ready: number;
  /** @nullable */
  shape?: string | null;
  size: number;
}
