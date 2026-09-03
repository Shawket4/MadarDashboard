/* eslint-disable */
// @ts-nocheck

export interface Department {
  created_at: string;
  /** Live employees currently assigned. Not stored. */
  employee_count: number;
  id: string;
  /**
     * Denormalised for the dashboard list; not stored.
     * @nullable
     */
  manager_name?: string | null;
  /** @nullable */
  manager_user_id?: string | null;
  name: string;
  org_id: string;
  updated_at: string;
}
