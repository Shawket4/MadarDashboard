/* eslint-disable */
// @ts-nocheck
import type { CoverageNeed } from './coverageNeed';

export interface PutCoverage {
  branch_id: string;
  /** The whole grid; an empty list clears it. */
  needs: CoverageNeed[];
}
