/* eslint-disable */
// @ts-nocheck
import type { BulkArchived } from './bulkArchived';
import type { BulkMode } from './bulkMode';
import type { BulkSummary } from './bulkSummary';

export interface BulkMenuResponse {
  archived?: null | BulkArchived;
  dry_run: boolean;
  /**
     * The `menu_imports` row; `None` on a dry run.
     * @nullable
     */
  import_id?: string | null;
  mode: BulkMode;
  /** What was written (or, on a dry run, would be). */
  summary: BulkSummary;
}
