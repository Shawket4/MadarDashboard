/* eslint-disable */
// @ts-nocheck

/**
 * Replace an employee's HR profile. Profile fields are a full replace (null
 * clears them); `name`, `phone`, `app_access` and `branch_ids` are kept when
 * omitted.
 */
export interface PutEmployeeRequest {
  /**
     * Turning it off signs the phone out.
     * @nullable
     */
  app_access?: boolean | null;
  /**
     * Piastres. Ignored unless the caller has `hr.payroll.edit` for every
     * branch — a branch manager editing a job title must not award a raise.
     * @nullable
     */
  base_salary_piastres?: number | null;
  /**
     * The whole set of branches.
     * @nullable
     */
  branch_ids?: string[] | null;
  /** @nullable */
  department_id?: string | null;
  /** @nullable */
  emergency_contact_name?: string | null;
  /** @nullable */
  emergency_contact_phone?: string | null;
  /** @nullable */
  employee_code?: string | null;
  /**
     * `active` | `suspended` | `terminated`. Defaults to `active`. Anything
     * but `active` signs the phone out (RO-10).
     * @nullable
     */
  employment_status?: string | null;
  /**
     * `m` · `f`; `null` or empty = not set; omitted keeps what is there.
     * @nullable
     */
  gender?: string | null;
  /** @nullable */
  hire_date?: string | null;
  /** @nullable */
  job_title?: string | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  national_id?: string | null;
  /** @nullable */
  notes?: string | null;
  /**
     * Paid through Dawam. Like the salary, ignored unless the caller has
     * `hr.payroll.edit` for every branch.
     * @nullable
     */
  on_payroll?: boolean | null;
  /**
     * The IBAN or wallet number; `null` or empty clears it; omitted keeps
     * it. Always cleared when the method is (or stays) `cash`.
     * @nullable
     */
  pay_account?: string | null;
  /**
     * `cash` · `bank` · `wallet`; omitted keeps what is there. Cash clears
     * the account.
     * @nullable
     */
  pay_method?: string | null;
  /**
     * A new number signs the old phone out (RO-10). Empty clears it.
     * @nullable
     */
  phone?: string | null;
  /** @nullable */
  photo_url?: string | null;
  /** @nullable */
  termination_date?: string | null;
}
