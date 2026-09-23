/* eslint-disable */
// @ts-nocheck

export interface MoveShiftRequest {
  /** Who has the shift now. */
  employee_id: string;
  on_date: string;
  /** Who gets it. */
  to_employee_id: string;
  work_shift_id: string;
}
