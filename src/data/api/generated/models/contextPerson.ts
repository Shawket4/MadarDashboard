/* eslint-disable */
// @ts-nocheck

export interface ContextPerson {
  /**
     * Their salary-advance cap, decided by the server (AV-5, AT-3); shown
     * under the same visibility as the salary.
     * @nullable
     */
  advance_cap_piastres?: number | null;
  /**
     * What they owe in salary advances is within the cap; never hidden, so
     * a manager sees "within cap" / "over cap" without the figure (D7).
     */
  advance_within_cap: boolean;
  /**
     * Only for people whose pay the caller may see.
     * @nullable
     */
  base_salary_piastres?: number | null;
  branch_ids: string[];
  cant_work_days: number[];
  /** @nullable */
  device_model?: string | null;
  /** @nullable */
  device_since?: string | null;
  employee_id: string;
  /** @nullable */
  gender?: string | null;
  /** @nullable */
  hire_date?: string | null;
  name: string;
  /** @nullable */
  pay_account?: string | null;
  pay_method: string;
  /** @nullable */
  phone?: string | null;
  /** @nullable */
  pref_time?: string | null;
  /**
     * `owner` · `manager` · `employee` (from the linked account; an employee
     * with no account is `employee`).
     */
  role: string;
  /**
     * Their Madar account, when they have one.
     * @nullable
     */
  user_id?: string | null;
}
