/* eslint-disable */
// @ts-nocheck

/**
 * Full replace of an employee's HR profile. A PUT rather than a POST because
 * the key is the user id: writing a profile for a user who has none promotes
 * them to staff, and writing it again edits them.
 */
export interface PutEmployeeRequest {
  /**
     * Piastres. Ignored unless the caller has `payroll:update` — a branch
     * manager editing a job title must not be able to award a raise.
     * @nullable
     */
  base_salary_piastres?: number | null;
  /** @nullable */
  department_id?: string | null;
  /** @nullable */
  emergency_contact_name?: string | null;
  /** @nullable */
  emergency_contact_phone?: string | null;
  /** @nullable */
  employee_code?: string | null;
  /**
     * `active` | `suspended` | `terminated`. Defaults to `active`.
     * @nullable
     */
  employment_status?: string | null;
  /** @nullable */
  hire_date?: string | null;
  /** @nullable */
  job_title?: string | null;
  /** @nullable */
  national_id?: string | null;
  /** @nullable */
  notes?: string | null;
  /** @nullable */
  photo_url?: string | null;
  /** @nullable */
  termination_date?: string | null;
}
