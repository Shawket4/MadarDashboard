/* eslint-disable */
// @ts-nocheck
import type { AttendanceRecord } from './attendanceRecord';

export interface TillPunchResult {
  /** The employee the PIN's owner is. */
  employee_id: string;
  name: string;
  /** `in` · `out` */
  punched: string;
  record: AttendanceRecord;
}
