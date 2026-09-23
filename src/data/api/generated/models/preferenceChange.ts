/* eslint-disable */
// @ts-nocheck

export interface PreferenceChange {
  cant_work_days: number[];
  /**
     * The manager's name, for a manager's change.
     * @nullable
     */
  changed_by_name?: string | null;
  created_at: string;
  /** @nullable */
  note?: string | null;
  /** @nullable */
  pref_time?: string | null;
  /** `employee` or `manager`. */
  source: string;
}
