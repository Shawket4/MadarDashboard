/* eslint-disable */
// @ts-nocheck
import type { CardDesign } from './cardDesign';
import type { Colours } from './colours';
import type { Ctx } from './ctx';
import type { Track } from './track';

/**
 * Everything the designer needs to open.
 */
export interface CardDesignView {
  /** The pass colours the shop has today. */
  colours: Colours;
  /** What designs are checked against: mode, tracks, photo. */
  ctx: Ctx;
  /**
     * False: the shop wears Madar's palette (custom branding is a super
     * admin's switch) — the designer locks the colours and the photograph.
     */
  custom_branding: boolean;
  /** The design a shop starts from (madar-card's default for it). */
  default_design: CardDesign;
  draft?: null | CardDesign;
  /** @nullable */
  logo_url?: string | null;
  /**
     * The shop's card photograph and logo (upload URLs) for the live preview.
     * @nullable
     */
  photo_url?: string | null;
  programme_name: string;
  /** @nullable */
  programme_name_ar?: string | null;
  published?: null | CardDesign;
  /** @nullable */
  published_at?: string | null;
  revision: number;
  /** What a unit of the card counts: `points`, `order`, `item` or `stamp`. */
  stamp_unit: string;
  /** The tracks, for labels and colours in the preview. */
  tracks: Track[];
}
