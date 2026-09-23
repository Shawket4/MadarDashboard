/* eslint-disable */
// @ts-nocheck

export interface Suggestion {
  /**
     * The gender default decided it: without it someone else would have
     * been suggested (it says so).
     */
  by_default: boolean;
  /** 0–100. Low (≤ 40) whenever the gender default decided it. */
  confidence: number;
  date: string;
  /** Who the suggestion puts on the shift. */
  employee_id: string;
  employee_name: string;
  /** @nullable */
  end_time?: string | null;
  /**
     * Who it takes off it, for a reassignment.
     * @nullable
     */
  from_employee_id?: string | null;
  /** @nullable */
  from_employee_name?: string | null;
  /** Opaque; send it back to accept or reject. */
  id: string;
  reason_args: unknown;
  /** A core i18n key for the one-line reason, and its arguments. */
  reason_key: string;
  shift_name: string;
  /**
     * The shift's times that day (a day-scoped block's own, else its default).
     * @nullable
     */
  start_time?: string | null;
  work_shift_id: string;
}
