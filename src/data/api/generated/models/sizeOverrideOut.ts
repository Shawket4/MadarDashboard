/* eslint-disable */
// @ts-nocheck

/**
 * Per-branch/channel availability & price overrides for a single size.
 */
export interface SizeOverrideOut {
  /**
     * Override availability; `null` = inherit (defaults to available).
     * @nullable
     */
  is_available?: boolean | null;
  /**
     * Override price in piastres; `null` = inherit the catalog default.
     * @nullable
     */
  price?: number | null;
  size_id: string;
}
