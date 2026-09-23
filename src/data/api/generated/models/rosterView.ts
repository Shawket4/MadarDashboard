/* eslint-disable */
// @ts-nocheck
import type { HolidayView } from './holidayView';
import type { LabourWarning } from './labourWarning';
import type { OpenShift } from './openShift';
import type { RosterPerson } from './rosterPerson';
import type { RosterShift } from './rosterShift';
import type { WorkShiftBrief } from './workShiftBrief';

export interface RosterView {
  branch_id: string;
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
