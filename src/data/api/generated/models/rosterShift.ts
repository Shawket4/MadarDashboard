/* eslint-disable */
// @ts-nocheck

export interface RosterShift {
  branch_id: string;
  /** Changed after its week was published (SC-4). */
  changed: boolean;
  /** Ends the next day. */
  crosses_midnight: boolean;
  date: string;
  employee_id: string;
  employee_name: string;
  end_at: string;
  end_time: string;
  /** The date holds its own set, not the standing pattern. */
  from_override: boolean;
  /** On approved leave or a mission that day. */
  on_leave: boolean;
  shift_name: string;
  start_at: string;
  /**
     * Effective wall-clock times at the branch (the assignment's own, else
     * the block's for that weekday, else its default).
     */
  start_time: string;
  /** This assignment has its own from/to (show it as edited). */
  times_edited: boolean;
  work_shift_id: string;
}
