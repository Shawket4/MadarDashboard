/* eslint-disable */
// @ts-nocheck

/**
 * JSON returned from every QR-generation endpoint.
 */
export interface QrResponse {
  kind: string;
  long_url: string;
  /** `data:image/png;base64,…` (or `data:image/svg+xml;base64,…` when
   * `svg=true`).  Paste into a browser `<img src="…">` to verify. */
  qr_data_url: string;
  short_code: string;
  short_url: string;
}
