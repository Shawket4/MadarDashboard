/* eslint-disable */
// @ts-nocheck
import type { BulkReviewPending } from './bulkReviewPending';

export interface BulkReviewResult {
  /** An id this call could not resolve, and why. Never silently dropped. */
  pending: BulkReviewPending[];
  /**
     * Ids that are now reviewed (already reviewed counts as resolved too —
     * resubmitting the same batch never fails or double-records).
     */
  resolved: number[];
}
