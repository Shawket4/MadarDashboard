/* eslint-disable */
// @ts-nocheck

/**
 * What a customer can change about their own card, without an account.
 *
 * The token in the URL is the credential — the same one their pass carries and
 * the till scans. That is deliberate: a person who has just been messaged must
 * be able to stop the messages by tapping the link in the message, not by
 * remembering a password they never made.
 */
export interface CardPreferences {
  /**
     * The language they are reading this page in.
     *
     * Sent by the page itself rather than chosen in a form. We stored whatever
     * their phone said at signup, and a phone that has since changed language
     * is a customer still being written to in the wrong one. Opening their own
     * card is the moment we can tell.
     * @nullable
     */
  locale?: string | null;
  /**
     * Stop sending marketing. Covers the birthday greeting as well as the
     * win-back: someone asking us to stop is asking the SHOP to stop, not to
     * be excluded from one campaign.
     * @nullable
     */
  marketing_opt_out?: boolean | null;
}
