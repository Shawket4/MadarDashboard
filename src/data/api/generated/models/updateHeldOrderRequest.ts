/* eslint-disable */
// @ts-nocheck

export interface UpdateHeldOrderRequest {
  /**
     * Optimistic-concurrency fence: reject (409) if the server has moved past
     * this revision. Omit to last-write-wins.
     * @nullable
     */
  base_revision?: number | null;
  /** @nullable */
  name?: string | null;
}
