/* eslint-disable */
// @ts-nocheck
import type { BranchFairness } from './branchFairness';
import type { FairnessRow } from './fairnessRow';

export interface FairnessView {
  accepted_4w: number;
  /** The same, branch by branch, each with its own gap flag. */
  branches: BranchFairness[];
  /** Suggestions managers decided in the last 4 weeks, and how many they accepted. */
  decided_4w: number;
  /** Learning is paused at some branch. */
  learning_frozen: boolean;
  month: string;
  /** Night share by gender against stated willingness, the whole business. */
  rows: FairnessRow[];
}
