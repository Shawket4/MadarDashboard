/* eslint-disable */
// @ts-nocheck

export interface CreateStaffRequest {
  /**
     * `correction` only — the record whose punch is wrong.
     * @nullable
     */
  attendance_record_id?: string | null;
  /** @nullable */
  end_date?: string | null;
  /** @nullable */
  from_time?: string | null;
  /** @nullable */
  is_half_day?: boolean | null;
  /**
     * One of `leave`, `late_arrival`, `early_departure`, `excuse`, `mission`,
     * `correction`.
     */
  kind: string;
  /** @nullable */
  leave_type_id?: string | null;
  /** @nullable */
  location?: string | null;
  on_date: string;
  /** @nullable */
  reason?: string | null;
  /** @nullable */
  title?: string | null;
  /** @nullable */
  to_time?: string | null;
  /**
     * Admin-only. Omitted on `/staff/me/*`, where it is always the caller.
     * @nullable
     */
  user_id?: string | null;
}
