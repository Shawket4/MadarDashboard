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
  /** @nullable */
  foreground_color?: string | null;
  /** @nullable */
  label_color?: string | null;
  /** @nullable */
  logo_url?: string | null;
  /** The organisation's name. Always present. */
  org_name: string;
  /** What the programme calls itself ("Rewards", "Bean Club"). */
  program_name: string;
  /** @nullable */
  program_name_ar?: string | null;
}
