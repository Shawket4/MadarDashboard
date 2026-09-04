/* eslint-disable */
// @ts-nocheck
import type { Column } from './column';
import type { Grain } from './grain';
import type { QuerySpec } from './querySpec';
import type { ResultBlockRowsItem } from './resultBlockRowsItem';
import type { ScopeInfo } from './scopeInfo';
import type { Viz } from './viz';

/**
 * One dataset the assistant pulled while answering. A turn may carry several —
 * "compare this month to last" is two.
 */
export interface ResultBlock {
  columns: Column[];
  /** @nullable */
  facet_by?: string | null;
  grain: Grain;
  /** @nullable */
  period_from?: string | null;
  /** @nullable */
  period_to?: string | null;
  /** @nullable */
  preset_id?: string | null;
  /** @minimum 0 */
  row_count: number;
  rows: ResultBlockRowsItem[];
  /** Which branches this block covers. */
  scope: ScopeInfo;
  /**
     * The exact query that produced this. Sending it back is what makes
     * "pin this answer to my dashboard" a single client-side action: the spec
     * is already a valid widget definition.
     */
  spec: QuerySpec;
  /**
     * Set when the data came from a curated metric.
     * @nullable
     */
  title?: string | null;
  truncated: boolean;
  viz: Viz;
}
