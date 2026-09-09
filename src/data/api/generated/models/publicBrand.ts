/* eslint-disable */
// @ts-nocheck

/**
 * A shop, as a guest page needs to know it.
 */
export interface PublicBrand {
  accent_color: string;
  /** `#RRGGBB`. Madar's own when the shop is not on the tier. */
  background_color: string;
  /** @nullable */
  card_image_url?: string | null;
  /**
     * Whether the rest of this is the shop's or Madar's.
     *
     * The page does not need it to render — the palette below is already
     * resolved — but it decides how loudly Madar signs the footer.
     */
  custom_branding: boolean;
  foreground_color: string;
  /**
     * True when the logo is a shape on transparency and may be repainted for
     * contrast. See `orgs::branding::is_mark`.
     */
  logo_is_mark: boolean;
  /** @nullable */
  logo_url?: string | null;
  /**
     * Always the shop's own name, at every tier. A page that does not say
     * whose it is helps nobody, and that was never the thing being sold.
     */
  name: string;
  org_id: string;
  slug: string;
}
