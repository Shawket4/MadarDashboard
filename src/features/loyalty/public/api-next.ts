/**
 * Fields the backend is adding to the public loyalty answers (wt-wafa-api),
 * declared here until `npm run generate:api` puts them on the generated models.
 * Optional, so today's server (which sends neither) gives today's page. When
 * the backend lands: regenerate, then delete this file and use `JoinInfo` /
 * `CardView` where these types are used.
 */
import type { CardView, JoinInfo } from "@/data/api/generated/models";

/** What one stamp counts (madar-card `text::stamp_unit`). */
export type StampUnitWire = "order" | "item" | "stamp" | "points";

export type JoinInfoNext = JoinInfo & {
  /**
   * How many members the shop has, rounded down by the server (1,200 for
   * 1,234); absent or null at 100 or fewer, so a small shop shows nothing.
   */
  member_count?: number | null;
  stamp_unit?: StampUnitWire | null;
};

export type CardViewNext = CardView & {
  stamp_unit?: StampUnitWire | null;
};
