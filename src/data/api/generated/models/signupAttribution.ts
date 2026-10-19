/* eslint-disable */
// @ts-nocheck

/**
 * Campaign tags from the signup page's URL (the landing copies them there).
 */
export interface SignupAttribution {
  /**
     * Meta's click id, for a later Conversions API event.
     * @nullable
     */
  fbclid?: string | null;
  /**
     * Google's click id.
     * @nullable
     */
  gclid?: string | null;
  /** @nullable */
  utm_campaign?: string | null;
  /** @nullable */
  utm_content?: string | null;
  /** @nullable */
  utm_medium?: string | null;
  /** @nullable */
  utm_source?: string | null;
  /** @nullable */
  utm_term?: string | null;
}
