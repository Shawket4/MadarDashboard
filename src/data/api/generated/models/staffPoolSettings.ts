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
  /**
     * Read only. `true` when a branch has no override of its own and these
     * are the organisation's settings (or the off default) it follows;
     * `branch_id` still names the branch asked about. Ignored on PUT.
     */
  readonly inherited?: boolean;
  org_id: string;
}
