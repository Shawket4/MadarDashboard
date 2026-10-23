/* eslint-disable */
// @ts-nocheck
import type { BirthdayGiftView } from './birthdayGiftView';
import type { CardBrand } from './cardBrand';
import type { MemberTrack } from './memberTrack';
import type { PassLinks } from './passLinks';
import type { PublicCard } from './publicCard';
import type { PublicReward } from './publicReward';

/**
 * The member's own card page — what they see when they open the link again.
 *
 * The token in the path is the member's secret, which is why this returns only
 * what the pass already shows and never the phone number in full.
 */
export interface CardView {
  /** The live balance, in `mode`'s currency. */
  balance: number;
  birthday_gift?: null | BirthdayGiftView;
  /** Whose card this is, and how it should look. */
  brand: CardBrand;
  can_redeem: boolean;
  card?: null | PublicCard;
  /**
     * The card size: how many stamps (or points) fill one card, the cheapest
     * reward on offer (`model::card_size`), the same figure the till and the
     * passes count towards. Equal to `next_reward_cost`, under its own name.
     * @nullable
     */
  card_size?: number | null;
  /** They have asked this shop to stop sending them things. */
  marketing_opt_out: boolean;
  member_token: string;
  mode: string;
  name: string;
  next_reward_cost: number;
  /**
     * "Order now": the ordering page, opened knowing who this is. Present only
     * when public ordering is configured and the shop takes online orders —
     * render the primary button when it is there, nothing when it is not.
     * @nullable
     */
  order_now_url?: string | null;
  passes: PassLinks;
  points_to_next_reward: number;
  /** Progress towards the next one, after the earned ones are set aside. */
  progress_to_next: number;
  rewards: PublicReward[];
  /** Rewards the balance has already earned — a card does not stop at full. */
  rewards_ready: number;
  /**
     * What one stamp stands for: `order`, `item` or `stamp` (a counter
     * shop); absent for points. The join info's rule (`earn::StampUnit`).
     * @nullable
     */
  stamp_unit?: string | null;
  /**
     * Every stamp track of this member's card, when there is more than one.
     * @nullable
     */
  tracks?: MemberTrack[] | null;
}
