/* eslint-disable */
// @ts-nocheck

/**
 * The member's birthday gift, while it can be used or was used this time.
 */
export interface BirthdayGiftView {
  /** `open` (ready to claim) or `claimed`. */
  status: string;
  /** The gift is usable until this instant (end of its last day, shop time). */
  valid_until: string;
}
