/* eslint-disable */
// @ts-nocheck
import type { ReplayBatchResultBody } from './replayBatchResultBody';
import type { ReplayOutcome } from './replayOutcome';

export interface ReplayBatchResult {
  /** The single-op call's JSON body (its ack, or its error body). */
  body?: ReplayBatchResultBody;
  /**
     * The op's position in `ops`.
     * @minimum 0
     */
  index: number;
  outcome: ReplayOutcome;
  /**
     * The HTTP status the single-op call would have answered (absent when skipped).
     * @minimum 0
     * @nullable
     */
  status?: number | null;
  /**
     * The single-op call's `X-Madar-Sync-Seq`, when it carried one.
     * @nullable
     */
  sync_seq?: number | null;
}
