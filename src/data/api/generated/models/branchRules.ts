/* eslint-disable */
// @ts-nocheck

/**
 * A branch and which of its rules it overrides.
 */
export interface BranchRules {
  branch_id: string;
  branch_name: string;
  /** The fields this branch sets itself; every other one is the business's. */
  overridden: string[];
  /** @nullable */
  updated_at?: string | null;
}
