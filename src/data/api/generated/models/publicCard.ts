/* eslint-disable */
// @ts-nocheck
import type { CardDesign } from './cardDesign';
import type { Track } from './track';

/**
 * A shop's card design as the public pages and the teller draw it: present
 * when the shop has a published design (or several stamp tracks, which get
 * the automatic one), absent for the classic look. No member data.
 */
export interface PublicCard {
  design: CardDesign;
  /** The published revision (0: the automatic multi-track design). */
  revision: number;
  /** `points`, `order`, `item` or `stamp` (madar-card `text::stamp_unit`). */
  stamp_unit: string;
  /** Track 1's size: the programme's card size. */
  track_one_size: number;
  /** The tracks, without their menu items. */
  tracks: Track[];
}
