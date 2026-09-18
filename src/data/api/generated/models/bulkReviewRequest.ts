/* eslint-disable */
// @ts-nocheck
import type { ReplayApproval } from './replayApproval';

export interface BulkReviewRequest {
  approval?: null | ReplayApproval;
  /**
     * Every open flag to resolve at once — a till, a day, or a hand-picked
     * selection. Order does not matter; each id is its own transaction.
     */
  flag_ids: number[];
  /** @nullable */
  note?: string | null;
}
