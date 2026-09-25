/* eslint-disable */
// @ts-nocheck

/**
 * An older month still to settle (hunt H2-P1).
 */
export interface UnsettledPeriod {
  ends_on: string;
  /**
     * The month's net pay: live for a draft, the frozen payslips once
     * approved.
     */
  net_total_piastres: number;
  /** Payslips marked paid (a 'none' mark counts); 0 for a draft. */
  paid_count: number;
  /** People on the month's payroll. */
  people: number;
  period_id: string;
  starts_on: string;
  /** `draft` (never approved) · `generated` (approved, someone unpaid) */
  status: string;
}
