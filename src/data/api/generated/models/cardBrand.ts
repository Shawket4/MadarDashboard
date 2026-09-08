/* eslint-disable */
// @ts-nocheck

/**
 * How a tenant's card should look.
 *
 * Every field is optional and the site falls back to Madar's own palette, so a
 * tenant who has set nothing still gets a finished card rather than an
 * unstyled one. `org_name` is NOT optional: whose card this is must always be
 * on it, however little else has been configured.
 */
export interface CardBrand {
  /**
     * `#RRGGBB`, validated on write.
     * @nullable
     */
  background_color?: string | null;
  /**
     * The wide photograph across the card — Apple's strip, Google's hero
     * image, and the band at the top of the web card. Absent is a finished
     * card, not a broken one.
     * @nullable
     */
  card_image_url?: string | null;
  /** @nullable */
  foreground_color?: string | null;
  /** @nullable */
  label_color?: string | null;
  /**
     * True when the logo is a shape on transparency, so the card may repaint
     * it in the foreground for contrast. False for a logo with its background
     * baked in, which gets a plate to sit on instead — repainting that one
     * would give a solid rectangle. See `orgs::branding::is_mark`.
     */
  logo_is_mark: boolean;
  /** @nullable */
  logo_url?: string | null;
  /** The organisation's name. Always present. */
  org_name: string;
  /** What the programme calls itself ("Rewards", "Bean Club"). */
  program_name: string;
  /** @nullable */
  program_name_ar?: string | null;
}
