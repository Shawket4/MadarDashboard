/* eslint-disable */
// @ts-nocheck
import type { SnapshotCursor } from './snapshotCursor';

export interface PullRequest {
  branch_id: string;
  /** @nullable */
  device_id?: string | null;
  /**
     * Opt-in paging of a FULL snapshot's ledger rows (tills, orders, cash,
     * refunds), 100..10000 rows a page. Absent = the whole snapshot in one
     * response (what every older client gets).
     * @nullable
     */
  ledger_page_size?: number | null;
  /**
     * Page size for incremental pulls, 1..5000 (default 2000).
     * @nullable
     */
  limit?: number | null;
  snapshot_cursor?: null | SnapshotCursor;
  /**
     * Full-fetch ONLY these types (checksum self-heal). Invalid with `since`.
     * @nullable
     */
  types?: string[] | null;
}
