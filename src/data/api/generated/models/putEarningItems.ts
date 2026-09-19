/* eslint-disable */
// @ts-nocheck

export interface PutEarningItems {
  /** @nullable */
  branch_id?: string | null;
  /**
     * The complete list for this scope, in order. An empty list clears it: for
     * an org that means every item collects again, for a branch it means going
     * back to inheriting the org's.
     */
  menu_item_ids: string[];
}
