/* eslint-disable */
// @ts-nocheck

/**
 * A person's shift at ANOTHER branch that date (BUG-4): the board shows it
 * ("at <branch>") so the cell never reads "Off", but it is not this
 * board's: never one of `shifts`, never sent back by a PUT from here.
 */
export interface ElsewhereShift {
  branch_id: string;
  branch_name: string;
  crosses_midnight: boolean;
  date: string;
  employee_id: string;
  end_time: string;
  shift_name: string;
  start_time: string;
  work_shift_id: string;
}
