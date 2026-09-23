/* eslint-disable */
// @ts-nocheck

export interface Suggestion {
  /** The gender default decided it (it says so). */
  by_default: boolean;
  /** 0–100. */
  confidence: number;
  date: string;
  /** Who the suggestion puts on the shift. */
  employee_id: string;
  employee_name: string;
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
  work_shift_id: string;
}
