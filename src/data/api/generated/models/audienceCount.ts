/* eslint-disable */
// @ts-nocheck

/**
 * Who an audience reaches, and how.
 */
export interface AudienceCount {
  /**
     * Reachable: holding an Apple card / a Google card / neither (WhatsApp
     * only, and only if asked for).
     */
  apple: number;
  google: number;
  /** Members matching the rules (opted-out ones included in this figure). */
  members: number;
  no_card: number;
  /** Of those, opted out of marketing: never sent to. */
  opted_out: number;
}
