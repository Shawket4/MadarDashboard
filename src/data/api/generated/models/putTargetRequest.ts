/* eslint-disable */
// @ts-nocheck

export interface PutTargetRequest {
  /**
     * Omit for the org default; set for a branch override.
     * @nullable
     */
  branch_id?: string | null;
  target_pct: number;
}
