/* eslint-disable */
// @ts-nocheck

/**
 * One request to Google and what it answered, kept verbatim.
 *
 * Provisioning is four requests deep and every one of them can fail in a way
 * the customer never sees: a refused class, an image Google will not fetch, a
 * field it silently drops. A failed REFRESH is deliberately only a warning —
 * the customer keeps the card they have — which means the reason lands in a
 * log nobody is reading at the moment it matters.
 *
 * So the same code path can be asked to keep a transcript. `save_url` throws
 * it away; the super-admin diagnostic returns it. One path, so what the
 * diagnostic reports is what actually happens, rather than a second
 * implementation that agrees with the first until it doesn't.
 */
export interface WalletStep {
  /** Google's answer, as it came. Truncated only if it is enormous. */
  body: string;
  /**
     * HTTP status, or 0 when the request never reached Google.
     * @minimum 0
     */
  status: number;
  /** What was attempted, in words: "insert the class", "update the object". */
  step: string;
}
