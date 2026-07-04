/* eslint-disable */
// @ts-nocheck
import type { BranchTarget } from './branchTarget';

export interface MarginTargets {
  branches: BranchTarget[];
  builtin_default_pct: number;
  /** @nullable */
  org_default_pct?: number | null;
}
