/* eslint-disable */
// @ts-nocheck
import type { ReplayBatchRequestOpsItem } from './replayBatchRequestOpsItem';

export interface ReplayBatchRequest {
  /**
     * Queued ops, oldest first: each exactly the body `POST /sync/replay`
     * takes (`op`, the actor, `request`, optional `approval`, ...).
     */
  ops: ReplayBatchRequestOpsItem[];
  /**
     * The sync protocol the till speaks; 2 when absent (this route is v2).
     * @minimum 0
     * @nullable
     */
  protocol?: number | null;
  /**
     * Stop at the first op that does not succeed (default true).
     * @nullable
     */
  stop_on_error?: boolean | null;
}
