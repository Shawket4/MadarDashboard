/* eslint-disable */
// @ts-nocheck
import type { ReplayBatchResult } from './replayBatchResult';

export interface ReplayBatchResponse {
  /**
     * How many ops were applied.
     * @minimum 0
     */
  applied: number;
  /**
     * The negotiated sync protocol.
     * @minimum 0
     */
  protocol: number;
  /** One per op, in order. */
  results: ReplayBatchResult[];
  /**
     * The index the batch stopped at, when it stopped early.
     * @minimum 0
     * @nullable
     */
  stopped_at?: number | null;
  /**
     * The highest `sync_seq` of the batch: a pull from here sees every op.
     * @nullable
     */
  sync_seq?: number | null;
}
