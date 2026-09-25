/* eslint-disable */
// @ts-nocheck

export interface Employee {
  /**
     * The owner's cap on what this person may owe in salary advances, in
     * piastres (AV-5): the server's figure, so no client recomputes it.
     * Hidden with the salary.
     * @nullable
     */
  advance_cap_piastres?: number | null;
  /**
     * What they owe in salary advances (pending ones counted) is within the
     * cap. Never hidden: what a manager sees instead of the cap (D7).
     */
  advance_within_cap: boolean;
  /** May sign in to the staff app with a WhatsApp code. */
  app_access: boolean;
  /**
     * `None` when the caller may not read this person's pay — see the module
     * docs — or when no salary is set (`salary_set` tells the two apart).
     * @nullable
     */
  base_salary_piastres?: number | null;
  /** Where they work; managers see the people of their branches (RO-6). */
  branch_ids: string[];
  /** Days they can't work: 0 = Sunday … 6 = Saturday. */
  cant_work_days: number[];
  created_at: string;
  /** @nullable */
  department_id?: string | null;
  /** @nullable */
  department_name?: string | null;
  /** @nullable */
  device_last_seen?: string | null;
  /**
     * The live phone signed in to the staff app, if any.
     * @nullable
     */
  device_model?: string | null;
  /** @nullable */
  device_since?: string | null;
  /** @nullable */
  email?: string | null;
  /** @nullable */
  emergency_contact_name?: string | null;
  /** @nullable */
  emergency_contact_phone?: string | null;
  /** @nullable */
  employee_code?: string | null;
  /** `active` · `suspended` · `terminated` */
  employment_status: string;
  /**
     * `m` · `f` · null — only ever a soft default for late shifts (SC-13).
     * @nullable
     */
  gender?: string | null;
  /** @nullable */
  hire_date?: string | null;
  id: string;
  /** @nullable */
  job_title?: string | null;
  /**
     * `linked` · `app` (signs in to the staff app, no Madar account) ·
     * `manual` (records only, no app).
     */
  kind: string;
  name: string;
  /** @nullable */
  national_id?: string | null;
  /** @nullable */
  notes?: string | null;
  /**
     * Paid through Dawam (the default). Off for someone who uses the app
     * and is rostered but is not paid here (an owner, say): the payroll
     * run, the estimate and the payslips skip them.
     */
  on_payroll: boolean;
  org_id: string;
  /** @nullable */
  pay_account?: string | null;
  /** `cash` · `bank` · `wallet` */
  pay_method: string;
  /** @nullable */
  phone?: string | null;
  /** @nullable */
  photo_url?: string | null;
  /**
     * `morning` · `evening` · null
     * @nullable
     */
  pref_time?: string | null;
  /**
     * The linked user's POS role; null for an unlinked employee.
     * @nullable
     */
  role?: string | null;
  /**
     * A salary is on file (owner decision D9): false = "not set" (someone a
     * manager added or imported), shown as "—" and flagged by payroll.
     * Never hidden: it says nothing about the amount.
     */
  salary_set: boolean;
  /** @nullable */
  termination_date?: string | null;
  updated_at: string;
  /**
     * The linked Madar user, when this employee is one (a cashier, a manager,
     * the owner). Null for someone who is only on payroll.
     * @nullable
     */
  user_id?: string | null;
}
