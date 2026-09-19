/* eslint-disable */
// @ts-nocheck

/**
 * The settings as the API states them, and as the PUT body accepts them.
 */
export interface StaffPoolSettings {
  /**
     * `null` = the org-wide default. A branch id = that branch's override.
     * @nullable
     */
  branch_id?: string | null;
  /** Staff drinks this branch may give in one business day. */
  daily_allowance?: number;
  /** The menu items that count. EMPTY = the pool is off. */
  eligible_item_ids?: string[];
  /** The owner's master switch for this scope. */
  enabled?: boolean;
  org_id: string;
}
