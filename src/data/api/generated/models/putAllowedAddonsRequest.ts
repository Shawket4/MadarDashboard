/* eslint-disable */
// @ts-nocheck

export interface PutAllowedAddonsRequest {
  /** Full replacement set of addon item IDs allowed on this menu item.
   * Send an empty array to clear the restriction (falls back to org catalog). */
  addon_item_ids: string[];
}
