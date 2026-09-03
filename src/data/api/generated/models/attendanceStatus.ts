/* eslint-disable */
// @ts-nocheck

/**
 * The five mutually-exclusive states an attendance row can be in.
 *
 * Stored as `text` with a CHECK constraint rather than a Postgres enum: statuses
 * here are a closed set we control, and text avoids the `ALTER TYPE ... ADD
 * VALUE` transaction dance every time the set grows.
 */
export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];


export const AttendanceStatus = {
  present: 'present',
  late: 'late',
  absent: 'absent',
  half_day: 'half_day',
  on_leave: 'on_leave',
} as const;
