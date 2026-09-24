/* eslint-disable */
// @ts-nocheck
import type { PlanDevice } from './planDevice';
import type { PlanPrinter } from './planPrinter';
import type { PlanSection } from './planSection';

export interface BranchPlan {
  devices?: PlanDevice[];
  printers?: PlanPrinter[];
  sections?: PlanSection[];
  /** Case 1 (till only): the till's receipt printer also prints kitchen chits. */
  till_prints_kitchen?: boolean;
}
