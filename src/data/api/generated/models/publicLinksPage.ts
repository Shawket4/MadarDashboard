/* eslint-disable */
// @ts-nocheck
import type { PublicBrand } from './publicBrand';
import type { PublicLinksBranch } from './publicLinksBranch';
import type { PublicLinksItem } from './publicLinksItem';
import type { PublicSocialLink } from './publicSocialLink';

/**
 * Everything the links page shows, in one request.
 */
export interface PublicLinksPage {
  /** Empty when "Visit us" is off. */
  branches: PublicLinksBranch[];
  brand: PublicBrand;
  /**
     * The card image, when the shop uses it as the cover (and is on the
     * branding tier — the loader already applied that).
     * @nullable
     */
  cover_image_url?: string | null;
  /** Visible, available buttons, in the shop's order. */
  items: PublicLinksItem[];
  /**
     * `points` or `visits`, when the rewards button is shown.
     * @nullable
     */
  loyalty_mode?: string | null;
  socials: PublicSocialLink[];
  /** @nullable */
  tagline_ar?: string | null;
  /** @nullable */
  tagline_en?: string | null;
}
