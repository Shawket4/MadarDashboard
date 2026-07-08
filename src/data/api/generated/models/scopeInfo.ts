/* eslint-disable */
// @ts-nocheck

/**
 * Which branches an answer actually covers — surfaced on every response so the
 * scope is never ambiguous ("all branches" vs a specific one).
 */
export interface ScopeInfo {
  /** True when the answer spans EVERY branch the caller can access. */
  all_branches: boolean;
  /** The branch names the answer covers. */
  branches: string[];
  /** Human-readable label, e.g. "All branches (3)" or "Sidi Henish". */
  label: string;
  /**
     * Set when the user named a branch that couldn't be matched; the answer
     * then falls back to all accessible branches and this flags the mismatch.
     * @nullable
     */
  unmatched_branch?: string | null;
}
