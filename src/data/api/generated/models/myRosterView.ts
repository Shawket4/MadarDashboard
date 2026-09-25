/* eslint-disable */
// @ts-nocheck
import type { MyClaim } from './myClaim';
import type { OpenShift } from './openShift';
import type { RosterShift } from './rosterShift';
import type { Swap } from './swap';

export interface MyRosterView {
  cant_work_days: number[];
  from: string;
  /**
     * My claims on open shifts, decided ones included: those on dates in
     * range, and every pending one wherever it falls (SC-9, S-162).
     */
  my_claims: MyClaim[];
  /** Open shifts at my branches, in published weeks (SC-9). */
  open_shifts: OpenShift[];
  /** @nullable */
  pref_time?: string | null;
  /** `employee` or `manager`: who set my preferences last. */
  prefs_set_by: string;
  /** Only shifts in published weeks (SC-3). */
  shifts: RosterShift[];
  swaps: Swap[];
  /** Colleagues' published shifts at my branches — what a swap can be with. */
  team: RosterShift[];
  to: string;
  /** Weeks in range that are not published yet at my branch. */
  unpublished_weeks: string[];
}
