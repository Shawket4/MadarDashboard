/* eslint-disable */
// @ts-nocheck
import type { BranchPlan } from './branchPlan';

export interface SavePlanRequest {
  branch_id: string;
  /**
     * The `version` the plan was loaded at. A save over a newer version is
     * refused (`PLAN_CHANGED`), so two people editing one branch never
     * silently overwrite each other.
     */
  expected_version: number;
  plan: BranchPlan;
}
