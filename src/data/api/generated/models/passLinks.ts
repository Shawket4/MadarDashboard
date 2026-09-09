/* eslint-disable */
// @ts-nocheck

/**
 * What signup hands the customer. Either side may be absent: a tenant with only
 * Google credentials configured shows one button, not a broken one.
 */
export interface PassLinks {
  /**
     * False when neither wallet is configured — the site shows the member's
     * QR on the page instead of dead buttons.
     */
  any: boolean;
  /**
     * Downloads the signed `.pkpass`. Site-relative, because the signup page
     * is served from the same origin as the API — so a pass needs a
     * CERTIFICATE, not a configured base URL.
     * @nullable
     */
  apple_url?: string | null;
  /**
     * `https://pay.google.com/gp/v/save/<jwt>`.
     * @nullable
     */
  google_url?: string | null;
}
