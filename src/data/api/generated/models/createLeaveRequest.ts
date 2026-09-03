/* eslint-disable */
// @ts-nocheck

export interface CreateLeaveRequest {
  end_date: string;
  /** @nullable */
  is_half_day?: boolean | null;
  leave_type_id: string;
  /** @nullable */
  reason?: string | null;
  start_date: string;
  /**
     * Admin-only. Omitted on `/staff/me/*`, where it is always the caller.
     * @nullable
     */
  user_id?: string | null;
}
