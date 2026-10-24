/* eslint-disable */
// @ts-nocheck

/**
 * The member's birthday gift, while it can be used or was used this time.
 */
export interface BirthdayGiftView {
  /**
     * The till's lookup only, while `open`: every line may be the gift
     * ("any item" is a reward here). Absent elsewhere.
     * @nullable
     */
  any_item?: boolean | null;
  /**
     * The till's lookup only, while `open`: the reward items the gift may be
     * taken as, whatever each costs (the whole catalogue, not only what the
     * balance affords). The till runs `madar_loyalty::gift_eligible` over
     * these and `any_item`, the server's own claim rule. Absent elsewhere.
     * @nullable
     */
  reward_item_ids?: string[] | null;
  /** `open` (ready to claim) or `claimed`. */
  status: string;
  /** The gift is usable until this instant (end of its last day, shop time). */
  valid_until: string;
}
