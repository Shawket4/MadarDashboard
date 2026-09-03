/* eslint-disable */
// @ts-nocheck

export interface UpsertLeaveTypeRequest {
  /** @nullable */
  annual_quota_days?: number | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  is_paid?: boolean | null;
  name: string;
  /** @nullable */
  requires_approval?: boolean | null;
}
