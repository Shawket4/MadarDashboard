/* eslint-disable */
// @ts-nocheck

/**
 * Add an employee of any kind (see the module docs).
 */
export interface CreateEmployeeRequest {
  /**
     * May sign in to the staff app. Defaults to "has a phone".
     * @nullable
     */
  app_access?: boolean | null;
  /**
     * Piastres. Ignored without `hr.payroll.edit` for every branch.
     * @nullable
     */
  base_salary_piastres?: number | null;
  /** @nullable */
  branch_id?: string | null;
  /** Where they work (at least one). `branch_id` is the older one-branch form. */
  branch_ids?: string[];
  /** @nullable */
  department_id?: string | null;
  /** @nullable */
  employee_code?: string | null;
  /**
     * `m` · `f`
     * @nullable
     */
  gender?: string | null;
  /**
     * Defaults to today.
     * @nullable
     */
  hire_date?: string | null;
  /** @nullable */
  job_title?: string | null;
  /**
     * Required unless `user_id` is given.
     * @nullable
     */
  name?: string | null;
  /**
     * Their WhatsApp number: how they sign in to the staff app.
     * @nullable
     */
  phone?: string | null;
  /**
     * Make this existing Madar user an employee (kind `linked`). Their name
     * and number are the defaults for the employee's.
     * @nullable
     */
  user_id?: string | null;
}
