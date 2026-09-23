/* eslint-disable */
// @ts-nocheck

export interface ContextPerson {
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
