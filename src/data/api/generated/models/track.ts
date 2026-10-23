/* eslint-disable */
// @ts-nocheck
import type { StampShape } from './stampShape';

/**
 * A track as the owner defines it.
 */
export interface Track {
  /**
     * Tracks 2–4: the balance ceiling (a stamp past it is trimmed); at least
     * the track's size. `None` = no ceiling.
     * @nullable
     */
  cap?: number | null;
  /**
     * This track's colour (`#RRGGBB`), else the pass's foreground.
     * @nullable
     */
  colour?: string | null;
  /**
     * Tracks 2–4: the menu items (ids) a sale earns on and a completed card
     * covers. Empty = a counter-only track. Always empty on track 1, whose
     * items are the programme's earning list and reward catalogue.
     */
  items?: string[];
  name_ar?: string;
  /** Shown on the pass and the teller page; required from track 2 on. */
  name_en?: string;
  /**
     * Tracks 2–4: a stamp per unit of its items (default), or one per sale
     * holding any. Track 1 follows the programme's own setting.
     */
  per_item?: boolean;
  /**
     * 1 to 4, in order. Track 1 is the programme's own counter.
     * @minimum 0
     */
  position: number;
  shape?: null | StampShape;
  /**
     * Stamps that fill this track's card. `None` on track 1, whose size is
     * the programme's card size (one number, one place).
     * @nullable
     */
  size?: number | null;
}
