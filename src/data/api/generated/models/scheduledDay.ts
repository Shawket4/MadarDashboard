/* eslint-disable */
// @ts-nocheck
import type { ResolvedShift } from './resolvedShift';

/**
 * One day of an employee's own upcoming roster.
 */
export interface ScheduledDay {
  /**
     * The branch each shift is worked at, when the employee has one assignment.
     * @nullable
     */
  branch_name?: string | null;
  date: string;
  /** Empty = a rest day. */
  shifts: ResolvedShift[];
}
