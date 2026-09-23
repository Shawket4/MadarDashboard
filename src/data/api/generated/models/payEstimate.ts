/* eslint-disable */
// @ts-nocheck
import type { ComputedPayslip } from './computedPayslip';

export interface PayEstimate {
  /** How much more can be asked for as an advance (AV-5). */
  advance_room_piastres: number;
  period_end: string;
  period_start: string;
  slip?: null | ComputedPayslip;
}
