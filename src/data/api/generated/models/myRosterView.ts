/* eslint-disable */
// @ts-nocheck
import type { OpenShift } from './openShift';
import type { RosterShift } from './rosterShift';
import type { Swap } from './swap';

export interface MyRosterView {
  cant_work_days: number[];
  from: string;
  /** Open shifts at my branches, in published weeks (SC-9). */
  open_shifts: OpenShift[];
  /** @nullable */
  pref_time?: string | null;
  /** Only shifts in published weeks (SC-3). */
  shifts: RosterShift[];
  swaps: Swap[];
  /** Colleagues' published shifts at my branches — what a swap can be with. */
  team: RosterShift[];
  to: string;
  /** Weeks in range that are not published yet at my branch. */
  unpublished_weeks: string[];
}
