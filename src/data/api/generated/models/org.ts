/* eslint-disable */
// @ts-nocheck

export interface Org {
  /** @nullable */
  brand_accent?: string | null;
  /**
     * The card palette derived from `logo_url` when it was uploaded
     * (`orgs::branding`). Read-only over the API: there is nothing to set, and
     * nothing a client may set — the point of deriving is that a shop cannot
     * choose two colours nobody can read.
     * @nullable
     */
  brand_background?: string | null;
  /** @nullable */
  brand_foreground?: string | null;
  currency_code: string;
  id: string;
  is_active: boolean;
  /** @nullable */
  logo_url?: string | null;
  name: string;
  /** @nullable */
  receipt_footer?: string | null;
  slug: string;
  /**
     * Tax rate as a decimal (e.g. `0.14` for 14% VAT).
     * Stored as `BigDecimal` internally; transmitted as a JSON number.
     */
  tax_rate: number;
  /**
     * IANA timezone name. The org-level default that branches inherit when
     * their own timezone is unset. Defaults to `Africa/Cairo`.
     */
  timezone: string;
}
