/* eslint-disable */
// @ts-nocheck
import type { ComputedPayslip } from './computedPayslip';

export interface PayEstimate {
  /** The owner's cap on what this person may owe (AV-5), server-computed. */
  advance_cap_piastres: number;
  advance_outstanding_piastres: number;
  /** How much more can be asked for as an advance (AV-5). */
  advance_room_piastres: number;
  on_payroll: boolean;
  period_end: string;
  period_start: string;
  slip?: null | ComputedPayslip;
}
