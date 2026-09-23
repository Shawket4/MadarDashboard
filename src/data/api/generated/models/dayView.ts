/* eslint-disable */
// @ts-nocheck
import type { LabourWarning } from './labourWarning';
import type { ResolvedShift } from './resolvedShift';

/**
 * One person's date after a change.
 */
export interface DayView {
  employee_id: string;
  /** The date follows the standing pattern (no date change). */
  follows_pattern: boolean;
  on_date: string;
  /** Empty = a day off (or nothing rostered). */
  shifts: ResolvedShift[];
  /** Labour limits the person's week now goes past. Warnings, never blocks. */
  warnings: LabourWarning[];
}
