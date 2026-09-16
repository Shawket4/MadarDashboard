/* eslint-disable */
// @ts-nocheck
import type { LintSeverity } from './lintSeverity';

/**
 * One finding. `entity_type` is `attachment` | `item` | `option` | `ingredient`.
 */
export interface LintIssue {
  entity_id: string;
  entity_name: string;
  entity_type: string;
  /**
     * The modifier group the finding is about, when it is group-scoped.
     * @nullable
     */
  group_id?: string | null;
  /**
     * The menu item the finding is about, when it is item-scoped.
     * @nullable
     */
  item_id?: string | null;
  message: string;
  /** Audit rule id, e.g. `F4`. */
  rule: string;
  severity: LintSeverity;
  /**
     * Set when the finding is about one size of an item.
     * @nullable
     */
  size_label?: string | null;
}
