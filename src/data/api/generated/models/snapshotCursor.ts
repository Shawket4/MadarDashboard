/* eslint-disable */
// @ts-nocheck

/**
 * Where a paged full snapshot stands. Every page reads the same horizon and
 * window, so the pages together are ONE snapshot: a ledger row that changes
 * while the pages are fetched moves past the horizon and arrives in the
 * incremental pull that follows (`since = next`), never twice and never lost.
 */
export interface SnapshotCursor {
  /** Ledger rows with `seq` above this come next. */
  after_seq: number;
  horizon: number;
  /**
     * When the snapshot began (RFC 3339): a till that closes while the pages
     * are fetched keeps its rows in the later pages.
     */
  started_at: string;
  /** The ledger window start of this snapshot (RFC 3339). */
  window_from: string;
}
