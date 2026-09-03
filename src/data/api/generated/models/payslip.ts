/* eslint-disable */
// @ts-nocheck

export interface Payslip {
  absent_days: number;
  advance_installment_piastres: number;
  base_salary_piastres: number;
  bonuses_piastres: number;
  breakdown: unknown;
  deductions_piastres: number;
  generated_at: string;
  id: string;
  late_minutes: number;
  leave_days: number;
  net_piastres: number;
  org_id: string;
  overtime_minutes: number;
  overtime_piastres: number;
  payroll_period_id: string;
  /** @nullable */
  period_end?: string | null;
  /**
     * The period this covers, denormalised. A payslip identified only by its
     * generation timestamp is unreadable — two months run on the same day would
     * be indistinguishable to the employee looking at them.
     * @nullable
     */
  period_name?: string | null;
  /** @nullable */
  period_start?: string | null;
  user_id: string;
  /** @nullable */
  user_name?: string | null;
  worked_days: number;
}
