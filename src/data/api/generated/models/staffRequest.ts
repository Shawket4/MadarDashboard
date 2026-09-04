/* eslint-disable */
// @ts-nocheck

export interface StaffRequest {
  /**
     * The record a `correction` proposes to fix. `None` for every other kind.
     * @nullable
     */
  attendance_record_id?: string | null;
  created_at: string;
  /** @nullable */
  decided_at?: string | null;
  /** @nullable */
  decided_by?: string | null;
  /** @nullable */
  decision_note?: string | null;
  /**
     * Set for `leave` and `mission`; the span's last day.
     * @nullable
     */
  end_date?: string | null;
  /**
     * Start of the excused window. `None` = open to the shift's start.
     * @nullable
     */
  from_time?: string | null;
  id: string;
  is_half_day: boolean;
  /**
     * Whether the excused time is paid. `None` until decided.
     * @nullable
     */
  is_paid?: boolean | null;
  /** `leave` | `late_arrival` | `early_departure` | `excuse` | `mission`. */
  kind: string;
  /** @nullable */
  leave_type_id?: string | null;
  /** @nullable */
  leave_type_name?: string | null;
  /** @nullable */
  location?: string | null;
  on_date: string;
  org_id: string;
  /** @nullable */
  reason?: string | null;
  status: string;
  /** @nullable */
  title?: string | null;
  /**
     * End of the excused window. `None` = open to the shift's end.
     * @nullable
     */
  to_time?: string | null;
  updated_at: string;
  user_id: string;
  /** @nullable */
  user_name?: string | null;
}
