/* eslint-disable */
// @ts-nocheck

/**
 * The branch the customer last ordered from, re-checked now.
 */
export interface OrderNowBranch {
  /** The channel they last used there. */
  channel: string;
  id: string;
  name: string;
  /**
     * True when it cannot be used as-is right now; the client falls back to
     * its branch/channel chooser and keeps the rest of the prefill.
     */
  stale: boolean;
  /**
     * `branch_unavailable` | `channel_closed`.
     * @nullable
     */
  stale_reason?: string | null;
}
