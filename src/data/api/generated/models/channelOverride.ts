/* eslint-disable */
// @ts-nocheck

/**
 * A branch's override of the org's toggles. `null` (or absent) inherits.
 */
export interface ChannelOverride {
  /** @nullable */
  delivery?: boolean | null;
  /** @nullable */
  online?: boolean | null;
  /** @nullable */
  pos?: boolean | null;
  /** @nullable */
  qr?: boolean | null;
}
