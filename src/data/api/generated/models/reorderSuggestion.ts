/* eslint-disable */
// @ts-nocheck
import type { ReorderLine } from './reorderLine';

/**
 * Reorder suggestions grouped by the ingredient's default supplier so the
 * dashboard can raise one draft PO per supplier.
 */
export interface ReorderSuggestion {
  lines: ReorderLine[];
  /** @nullable */
  supplier_id?: string | null;
  /** @nullable */
  supplier_name?: string | null;
}
