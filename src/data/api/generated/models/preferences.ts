/* eslint-disable */
// @ts-nocheck

export interface Preferences {
  /** Days I can't work: 0 = Sunday … 6 = Saturday. */
  cant_work_days?: number[];
  /**
     * Why (a manager's override).
     * @nullable
     */
  note?: string | null;
  /**
     * `morning` · `evening` · null
     * @nullable
     */
  pref_time?: string | null;
}
