/* eslint-disable */
// @ts-nocheck

export interface ApplyPackagingRulesResult {
  catalog_revision: number;
  /** Sizes (incl. linked copies) whose stored lines changed. */
  sizes_changed: number;
  /** Sizes examined (every size of every live item in the org). */
  sizes_seen: number;
  /**
     * Sizes that still have an OWN line in a packaging category: typed by hand, they
     * are kept (and win over a rule for the same ingredient) — review them.
     */
  sizes_with_manual_packaging: number;
  /** Sizes that now carry at least one rule line. */
  sizes_with_rule: number;
}
