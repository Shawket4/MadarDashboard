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
  /** @nullable */
  job_title?: string | null;
  late_minutes: number;
  /**
     * Minutes this person is rostered for today — the denominator of the
     * labour-vs-plan bar.
     */
  scheduled_minutes: number;
  /** `in` | `late` | `absent` | `on_leave` | `off` | `done`. */
  state: string;
  user_id: string;
  user_name: string;
  worked_minutes: number;
}
