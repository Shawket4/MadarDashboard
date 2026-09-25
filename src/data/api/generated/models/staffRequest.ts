/* eslint-disable */
// @ts-nocheck

export interface StaffRequest {
  /**
     * The record a `correction` proposes to fix. `None` for every other kind.
     * @nullable
     */
  attendance_record_id?: string | null;
  /**
     * The caller may approve or reject it now: it is pending, not their own,
     * at one of their branches, and — a manager's request — they outrank
     * the requester (RQ-5). The same checks the decision makes.
     */
  can_decide?: boolean;
  /** @nullable */
  cancel_note?: string | null;
  /** @nullable */
  cancelled_at?: string | null;
  /**
     * Who cancelled it (the person themselves or a manager), when and why.
     * @nullable
     */
  cancelled_by?: string | null;
  /**
     * Who cancelled it, by name, the same way.
     * @nullable
     */
  cancelled_by_name?: string | null;
  created_at: string;
  /** @nullable */
  decided_at?: string | null;
  /**
     * Who approved or rejected it, when and why. A later cancellation keeps
     * these (the approval stays on record) and fills `cancelled_*`.
     * @nullable
     */
  decided_by?: string | null;
  /**
     * Who decided it, by name — their employee's name when linked, else
     * their account's — so a phone that can't look up the owner's account
     * still names them (RQ-F6).
     * @nullable
     */
  decided_by_name?: string | null;
  /** @nullable */
  decision_note?: string | null;
  employee_id: string;
  /** @nullable */
  employee_name?: string | null;
  /**
     * Set for `leave` and `mission`: the span's last day. For an `excuse`
     * that runs past midnight, the next day (its end is then on that day).
     * @nullable
     */
  end_date?: string | null;
  /**
     * Start of the excused window. `None` = open to the shift's start.
     * For a `correction`: the proposed check-in, branch-local.
     * @nullable
     */
  from_time?: string | null;
  id: string;
  is_half_day: boolean;
  /** The request is the CALLER's own (worked out for whoever asks). */
  is_own?: boolean;
  /**
     * Whether the excused time is paid. `None` until decided.
     * @nullable
     */
  is_paid?: boolean | null;
  /** `leave` | `late_arrival` | `early_departure` | `excuse` | `mission` | `correction`. */
  kind: string;
  /**
     * A half-day leave: `first` or `second` half of the day off (RQ-8).
     * @nullable
     */
  leave_half?: string | null;
  /**
     * Deprecated (RQ-2): older rows only; never set on new requests.
     * @nullable
     */
  leave_type_id?: string | null;
  /** @nullable */
  leave_type_name?: string | null;
  /** @nullable */
  location?: string | null;
  /**
     * A day of it is in an approved or paid month: approving or cancelling
     * approved time is refused (PERIOD_CLOSED); rejecting still works.
     */
  month_closed?: boolean;
  on_date: string;
  org_id: string;
  /**
     * For a pending excuse or early departure: the business's (or branch's)
     * rule, which the approve dialog starts from (RQ-7).
     * @nullable
     */
  paid_default?: boolean | null;
  /** @nullable */
  reason?: string | null;
  /**
     * For a correction: the record's current punches, so an approver sees
     * what the proposal changes.
     * @nullable
     */
  record_check_in_at?: string | null;
  /** @nullable */
  record_check_out_at?: string | null;
  status: string;
  /** @nullable */
  title?: string | null;
  /**
     * A manager's own request waiting for someone above them (RQ-5): the
     * owner decides it. Worked out by the server from capabilities.
     */
  to_owner?: boolean;
  /**
     * End of the excused window. `None` = open to the shift's end.
     * For a `correction`: the proposed check-out, branch-local (earlier on the
     * clock than the check-in = the next morning, a night shift).
     * @nullable
     */
  to_time?: string | null;
  updated_at: string;
  /**
     * The shift a late arrival, early departure or excuse is for (split days).
     * @nullable
     */
  work_shift_id?: string | null;
  /**
     * For a leave or mission: the days it covers that the person already
     * clocked in on. Approving turns those worked days into leave (the
     * punches are kept), so the approver is warned first (minor default
     * M16). Empty for every other kind.
     */
  worked_dates?: string[];
}
