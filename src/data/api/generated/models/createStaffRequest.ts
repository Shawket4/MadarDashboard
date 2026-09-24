/* eslint-disable */
// @ts-nocheck

export interface CreateStaffRequest {
  /**
     * `correction` only — the record whose punch is wrong.
     * @nullable
     */
  attendance_record_id?: string | null;
  /**
     * Admin-only. Omitted on `/staff/me/*`, where it is always the caller.
     * @nullable
     */
  employee_id?: string | null;
  /** @nullable */
  end_date?: string | null;
  /**
     * Branch-local wall clock.
     * @nullable
     */
  from_time?: string | null;
  /** @nullable */
  is_half_day?: boolean | null;
  /**
     * Only when the request is approved as it is filed (the filer holds
     * `hr.requests.self_approve`): leave paid or unpaid — REQUIRED for such a
     * leave (400 `LEAVE_PAY_REQUIRED`, RQ-2) — and an excuse's pay (omitted:
     * the rule decides).
     * @nullable
     */
  is_paid?: boolean | null;
  /**
     * One of `leave`, `late_arrival`, `early_departure`, `excuse`, `mission`,
     * `correction`.
     */
  kind: string;
  /**
     * `first` | `second`: which half of the day a half-day leave takes off.
     * Omitted on a half day = the first.
     * @nullable
     */
  leave_half?: string | null;
  /**
     * Deprecated (RQ-2): ignored. Leave has no types.
     * @nullable
     */
  leave_type_id?: string | null;
  /** @nullable */
  location?: string | null;
  on_date: string;
  /** @nullable */
  reason?: string | null;
  /**
     * A mission's title; when omitted the note is used.
     * @nullable
     */
  title?: string | null;
  /**
     * Branch-local wall clock. An excuse ending at or before it starts runs
     * past midnight.
     * @nullable
     */
  to_time?: string | null;
  /**
     * The shift a late arrival, early departure or excuse is for. Omitted =
     * the shift of the day its time falls in.
     * @nullable
     */
  work_shift_id?: string | null;
}
