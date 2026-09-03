/* eslint-disable */
// @ts-nocheck

export interface Employee {
  /**
     * `None` when the caller lacks `payroll:read` — see the module docs.
     * @nullable
     */
  base_salary_piastres?: number | null;
  created_at: string;
  /** @nullable */
  department_id?: string | null;
  /** @nullable */
  department_name?: string | null;
  /** @nullable */
  email?: string | null;
  /** @nullable */
  emergency_contact_name?: string | null;
  /** @nullable */
  emergency_contact_phone?: string | null;
  /** @nullable */
  employee_code?: string | null;
  employment_status: string;
  /** @nullable */
  hire_date?: string | null;
  is_active: boolean;
  /** @nullable */
  job_title?: string | null;
  /**
     * From `users` — the employee's name IS their user name; there is no
     * second copy to drift.
     */
  name: string;
  /** @nullable */
  national_id?: string | null;
  /** @nullable */
  notes?: string | null;
  org_id: string;
  /** @nullable */
  phone?: string | null;
  /** @nullable */
  photo_url?: string | null;
  /**
     * The POS role. Orthogonal to employment: a cleaner is a `teller`-role user
     * with the POS permissions revoked.
     */
  role: string;
  /** @nullable */
  termination_date?: string | null;
  updated_at: string;
  user_id: string;
}
