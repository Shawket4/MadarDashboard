/* eslint-disable */
// @ts-nocheck
import type { FairnessRow } from './fairnessRow';

export interface BranchFairness {
  accepted: number;
  branch_id: string;
  branch_name: string;
  /** Suggestions the gender default decided, of those decided in the month. */
  by_default_decided: number;
  decided: number;
  /** Over 20 points (design §4.2). */
  flagged: boolean;
  /**
     * The widest gap, in percentage points, between a gender's share of the
     * night shifts and its share of stated willingness (of headcount when
     * nobody stated any).
     */
  gap_points: number;
  /** Learning is paused at this branch: under 40% accepted over 4 weeks. */
  learning_frozen: boolean;
  rows: FairnessRow[];
}
