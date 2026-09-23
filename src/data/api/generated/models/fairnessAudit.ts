/* eslint-disable */
// @ts-nocheck
import type { BranchFairness } from './branchFairness';

export interface FairnessAudit {
  branch_id: string;
  computed_at: string;
  flagged: boolean;
  month: string;
  report: BranchFairness;
}
