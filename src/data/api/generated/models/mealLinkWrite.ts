/* eslint-disable */
// @ts-nocheck

/**
 * `PUT /menu-items/{id}/meal`. Both set = link; both `null` (or a JSON
 * `null` body) = unlink.
 */
export interface MealLinkWrite {
  /** @nullable */
  combo_id?: string | null;
  /** @nullable */
  slot_id?: string | null;
}
