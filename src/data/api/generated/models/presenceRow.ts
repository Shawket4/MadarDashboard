/* eslint-disable */
// @ts-nocheck

/**
 * One person's state right now, for the manager's live team list.
 */
export interface PresenceRow {
  /** @nullable */
  branch_name?: string | null;
  /** @nullable */
  check_in_at?: string | null;
  /** @nullable */
  check_out_at?: string | null;
  employee_id: string;
  employee_name: string;
  /** @nullable */
  job_title?: string | null;
  late_minutes: number;
  /**
     * When a punch for them opens: the next shift of their today (not yet
     * ended; else the first) less its check-in window (CL-3). Null when not
     * rostered. The dashboard offers Punch from then, as the app does
     * (minor default M15).
     * @nullable
     */
  punch_opens_at?: string | null;
  /**
     * Minutes this person is rostered for today — the denominator of the
     * labour-vs-plan bar.
     */
  scheduled_minutes: number;
  /** `in` | `late` | `absent` | `on_leave` | `off` | `done`. */
  state: string;
  worked_minutes: number;
}
