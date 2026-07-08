/* eslint-disable */
// @ts-nocheck
import type { RepricingSuggestion } from './repricingSuggestion';

/**
 * The repricing surface for a branch (or org-wide).
 */
export interface RepricingReport {
  branch_id: string;
  /** Active priced SKUs considered in total. */
  skus_considered: number;
  /**
     * Active priced SKUs whose cost is not fully known — NOT suggested (no
     * guessed cost); surfaced so coverage is transparent.
     */
  skus_cost_unknown: number;
  /** Underpriced SKUs with a target-restoring suggestion, biggest uplift first. */
  suggestions: RepricingSuggestion[];
  target_pct: number;
  /** `branch` | `org` | `default`. */
  target_source: string;
}
