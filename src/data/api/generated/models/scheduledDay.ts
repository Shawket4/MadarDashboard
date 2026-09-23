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
  /**
     * The week is published at the person's branch. Unpublished weeks are
     * drafts: they come back empty (SC-3).
     */
  published?: boolean;
  /** Empty = a rest day, or a week not published yet. */
  shifts: ResolvedShift[];
}
