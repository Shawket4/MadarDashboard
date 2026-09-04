/* eslint-disable */
// @ts-nocheck

/**
 * Which branches an answer actually covers. Returned on every response so the
 * scope of a number is never ambiguous — "all branches" versus one of them is
 * the difference between a figure being right and being off by a factor of
 * however many branches the merchant has.
 */
export interface ScopeInfo {
  /** True when the answer spans every branch the caller can access. */
  all_branches: boolean;
  branches: string[];
  /** Human-readable label, e.g. "All branches (3)" or "Sidi Henish". */
  label: string;
  /**
     * Set when a branch was named but could not be matched. The answer then
     * falls back to the full accessible set, and this flags the mismatch rather
     * than silently answering a different question.
     * @nullable
     */
  unmatched_branch?: string | null;
}
