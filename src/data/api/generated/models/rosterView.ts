/* eslint-disable */
// @ts-nocheck
import type { DateSet } from './dateSet';
import type { ElsewhereShift } from './elsewhereShift';
import type { HolidayView } from './holidayView';
import type { LabourWarning } from './labourWarning';
import type { OpenShift } from './openShift';
import type { RosterPerson } from './rosterPerson';
import type { RosterShift } from './rosterShift';
import type { WorkShiftBrief } from './workShiftBrief';

export interface RosterView {
  branch_id: string;
  /**
     * The dates whose part at THIS branch is not the pattern's (a date
     * change here, a day off included): the ones "back to the pattern"
     * applies to on this board. A date changed only at another branch is
     * not one (BUG-4).
     */
  date_sets?: DateSet[];
  /**
     * The staff's shifts at other branches in range, for display only
     * (BUG-4).
     */
  elsewhere?: ElsewhereShift[];
  from: string;
  holidays: HolidayView[];
  /** The limits are not yet confirmed by a lawyer; say so beside them. */
  limits_unconfirmed: boolean;
  open_shifts: OpenShift[];
  /** Saturdays of the published weeks in range. */
  published_weeks: string[];
  shifts: RosterShift[];
  staff: RosterPerson[];
  to: string;
  /**
     * Labour limits the roster (or, for `overtime_day`, the clock) goes past.
     * Warnings, never blocks (RU-13).
     */
  warnings: LabourWarning[];
  work_shifts: WorkShiftBrief[];
}
