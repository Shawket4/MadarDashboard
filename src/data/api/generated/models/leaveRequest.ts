/* eslint-disable */
// @ts-nocheck

export interface LeaveRequest {
  created_at: string;
  /** @nullable */
  decided_at?: string | null;
  /** @nullable */
  decided_by?: string | null;
  /** @nullable */
  decision_note?: string | null;
  end_date: string;
  id: string;
  is_half_day: boolean;
  leave_type_id: string;
  /** @nullable */
  leave_type_name?: string | null;
  org_id: string;
  /** @nullable */
  reason?: string | null;
  start_date: string;
  status: string;
  updated_at: string;
  user_id: string;
  /** @nullable */
  user_name?: string | null;
}
