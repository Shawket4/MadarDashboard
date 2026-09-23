/* eslint-disable */
// @ts-nocheck

export interface RosterPerson {
  cant_work_days: number[];
  /** @nullable */
  department_id?: string | null;
  employee_id: string;
  /** @nullable */
  gender?: string | null;
  name: string;
  /** @nullable */
  pref_time?: string | null;
  /** Who set the preferences last: `employee` or `manager` (SC-12). */
  prefs_set_by: string;
}
