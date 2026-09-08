/* eslint-disable */
// @ts-nocheck

export interface UpdateOrgRequest {
  /** @nullable */
  currency_code?: string | null;
  /**
     * May this organisation wear its own mark and colours on the customer's
     * card and signup page? A paid tier, and this endpoint is already
     * super-admin only — which is the whole reason it lives here rather than
     * with the other branding controls an org manager can reach.
     * @nullable
     */
  custom_branding?: boolean | null;
  /** @nullable */
  is_active?: boolean | null;
  /**
     * `null` clears the logo; absent leaves it unchanged. To set a new
     * logo, use `PUT /orgs/{id}/logo` (multipart) instead — JSON updates
     * only accept the clear-to-null case here.
     * @nullable
     */
  logo_url?: string | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  receipt_footer?: string | null;
  /** @nullable */
  slug?: string | null;
  /** @nullable */
  tax_rate?: number | null;
  /**
     * IANA timezone name (e.g. `Africa/Cairo`). Validated against the
     * PostgreSQL timezone database. Branches inherit this when their own
     * timezone is unset.
     * @nullable
     */
  timezone?: string | null;
}
