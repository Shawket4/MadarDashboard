/* eslint-disable */
// @ts-nocheck

export interface LeaveBalance {
  carried_over_days: number;
  entitled_days: number;
  id: string;
  leave_type_id: string;
  /** @nullable */
  leave_type_name?: string | null;
  org_id: string;
  /** `entitled + carried_over − used`. Computed, not stored. */
  remaining_days: number;
  used_days: number;
  user_id: string;
  year: number;
}
