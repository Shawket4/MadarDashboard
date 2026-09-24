/* eslint-disable */
// @ts-nocheck
import type { BranchPlan } from './branchPlan';

export interface PlanVersionView {
  plan: BranchPlan;
  saved_at: string;
  /** @nullable */
  saved_by_name?: string | null;
  version: number;
}
