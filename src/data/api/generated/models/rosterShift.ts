/* eslint-disable */
// @ts-nocheck

export interface RosterShift {
  branch_id: string;
  /** Changed after its week was published (SC-4). */
  changed: boolean;
  date: string;
  end_at: string;
  /** On approved leave or a mission that day. */
  on_leave: boolean;
  shift_name: string;
  start_at: string;
  user_id: string;
  user_name: string;
  work_shift_id: string;
}
