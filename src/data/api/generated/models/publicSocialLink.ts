/* eslint-disable */
// @ts-nocheck

/**
 * One place the shop can be found, as a page prints it.
 *
 * The same three things the wallet passes render (`wallet::apple`,
 * `wallet::google`), so the card in the phone and the card on the page list
 * the same links in the same order.
 */
export interface PublicSocialLink {
  /** One of `orgs::social::PLATFORMS` — what the page picks its glyph by. */
  key: string;
  /**
     * What a human calls it. The page falls back to this where it has no
     * glyph for `key`, so a platform added on the server still renders.
     */
  label: string;
  /**
     * `https://…` and nothing else — checked on write and again on read, see
     * `orgs::social::links_of`.
     */
  url: string;
}
