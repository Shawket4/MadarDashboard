/**
 * Fields the backend is adding to the public loyalty answers, declared here
 * until `npm run generate:api` puts them on the generated models. Optional, so
 * today's server (which sends none of them) gives today's page. When the
 * backend lands: regenerate, then delete this file and use `JoinInfo` /
 * `CardView` where these types are used.
 *
 * MadarRust main (5b5396a8) sends `stamp_unit`, `card_size` and
 * `birthday_gift` on the join info and the card view, and `member_count` on the
 * join info; wt-rewards-dash-api also puts the stamp unit inside the optional
 * `card` (the published design). The page reads either (`stampUnitOf`).
 */
import type { CardView, JoinInfo } from "@/data/api/generated/models";

/** What one stamp counts (madar-card `text::stamp_unit`). */
export type StampUnitWire = "order" | "item" | "stamp" | "points";

/** The part of the published design (`PublicCard`) the page reads. */
interface CardDesignNext {
  stamp_unit?: string | null;
}

/**
 * The card's size by the cheapest reward (the till's rule), which the server is
 * adding to both answers; absent, the card goes by `next_reward_cost`.
 */
type CardSizeNext = { card_size?: number | null };

export type JoinInfoNext = JoinInfo & CardSizeNext & {
  /**
   * How many members the shop has, rounded down by the server (1,200 for
   * 1,234); absent or null at 100 or fewer, so a small shop shows nothing.
   */
  member_count?: number | null;
  stamp_unit?: StampUnitWire | null;
  card?: CardDesignNext | null;
  /**
   * What a birthday gives here: `item` (one free item) or `amount`
   * (`birthday_reward_amount` on the card); absent when birthdays give nothing.
   */
  birthday_gift?: "item" | "amount" | null;
};

export type CardViewNext = CardView & CardSizeNext & {
  stamp_unit?: StampUnitWire | null;
  card?: CardDesignNext | null;
  /** The member's birthday gift while it is open, or claimed and still in its window. */
  birthday_gift?: BirthdayGiftView | null;
};

/** `BirthdayGiftView`: `valid_until` is the end of the gift's last day, shop time. */
export interface BirthdayGiftView {
  status: "open" | "claimed" | string;
  valid_until: string;
}

/** The server's word for a stamp, wherever this server put it. */
export const stampUnitOf = (d: { stamp_unit?: string | null; card?: CardDesignNext | null }): string | null =>
  d.stamp_unit ?? d.card?.stamp_unit ?? null;
