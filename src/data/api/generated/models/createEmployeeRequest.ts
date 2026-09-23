/* eslint-disable */
// @ts-nocheck

export interface CreateEmployeeRequest {
  /**
     * Piastres. Ignored without `payroll:update`, as on the profile.
     * @nullable
     */
  base_salary_piastres?: number | null;
  branch_id: string;
  /**
     * `m` · `f`
     * @nullable
     */
  gender?: string | null;
  /** @nullable */
  job_title?: string | null;
  name: string;
  /** Their WhatsApp number: how they sign in to Dawam. */
  phone: string;
}
