/* eslint-disable */
// @ts-nocheck
import type { AttendanceRecord } from './attendanceRecord';
import type { ResolvedShift } from './resolvedShift';

/**
 * What the mobile app shows on its home screen.
 */
export interface MyAttendanceToday {
  /**
     * Why `can_check_in` is false, in words the app can show verbatim.
     * @nullable
     */
  blocked_reason?: string | null;
  /**
     * WHERE to clock in today. Resolved server-side — from the open record, the
     * rostered shift's branch, or the employee's single branch assignment — so
     * the app never has to ask. A branch picker would make the geofence
     * answerable to a dropdown, which defeats the point of having one.
     * `None` means we cannot tell, and the app should say so rather than guess.
     * @nullable
     */
  branch_id?: string | null;
  /** The business date in the relevant branch's timezone — not the device's. */
  business_date: string;
  can_check_in: boolean;
  can_check_out: boolean;
  /** Records already closed today. */
  closed_records: AttendanceRecord[];
  open_record?: null | AttendanceRecord;
  /** Shifts rostered for today. Empty = a rest day. */
  scheduled: ResolvedShift[];
}
