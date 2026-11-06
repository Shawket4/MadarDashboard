/* eslint-disable */
// @ts-nocheck

/**
 * JSON returned from every QR-generation endpoint.
 */
export interface QrResponse {
  /**
     * Whether anything sits in the middle of the code: always on the card (the
     * shop's logo, or Madar's mark), never on the receipt QR, and on the
     * unbranded code only when `centre_logo` was asked for AND the shop has a
     * printable logo on the branding tier. `false` with `unbranded=true` and
     * `centre_logo=true` is how a client learns there was no logo to put there.
     */
  centre_logo?: boolean;
  kind: string;
  long_url: string;
  /**
     * `data:image/png;base64,…` (or `data:image/svg+xml;base64,…` when
     * `svg=true`).  Paste into a browser `<img src="…">` to verify.
     */
  qr_data_url: string;
  short_code: string;
  short_url: string;
}
