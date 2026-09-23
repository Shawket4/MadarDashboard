/* eslint-disable */
// @ts-nocheck
import type { AttendanceRecord } from './attendanceRecord';

export interface TillPunchResult {
  name: string;
  /** `in` · `out` */
  punched: string;
  record: AttendanceRecord;
  user_id: string;
}
