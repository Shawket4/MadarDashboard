/* eslint-disable */
// @ts-nocheck
import type { BranchComparison } from './branchComparison';

export interface OrgComparisonReport {
  branches: BranchComparison[];
  /** @nullable */
  from?: string | null;
  org_id: string;
  /** @nullable */
  to?: string | null;
}
