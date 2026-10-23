/**
 * Fields the backend is adding to the public loyalty answers, declared here
 * until `npm run generate:api` puts them on the generated models. Optional, so
 * today's server (which sends none of them) gives today's page. When the
 * backend lands: regenerate, then delete this file and use `JoinInfo` /
 * `CardView` where these types are used.
 *
 * Two branches carry the stamp unit, in two places: wt-wafa-api puts
 * `stamp_unit` on the join info itself; wt-rewards-dash-api puts it inside the
 * optional `card` (the published design), on the join info and the card view.
 * The page reads either (`stampUnitOf`).
 */
import type { CardView, JoinInfo } from "@/data/api/generated/models";

/** What one stamp counts (madar-card `text::stamp_unit`). */
export type StampUnitWire = "order" | "item" | "stamp" | "points";

/** The part of the published design (`PublicCard`) the page reads. */
interface CardDesignNext {
  stamp_unit?: string | null;
}

export type JoinInfoNext = JoinInfo & {
  /**
   * How many members the shop has, rounded down by the server (1,200 for
   * 1,234); absent or null at 100 or fewer, so a small shop shows nothing.
   */
  member_count?: number | null;
  stamp_unit?: StampUnitWire | null;
  card?: CardDesignNext | null;
};

export type CardViewNext = CardView & {
  stamp_unit?: StampUnitWire | null;
  card?: CardDesignNext | null;
};

/** The server's word for a stamp, wherever this server put it. */
export const stampUnitOf = (d: { stamp_unit?: string | null; card?: CardDesignNext | null }): string | null =>
  d.stamp_unit ?? d.card?.stamp_unit ?? null;
