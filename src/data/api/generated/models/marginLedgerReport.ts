/* eslint-disable */
// @ts-nocheck
import type { LedgerTotals } from './ledgerTotals';
import type { MarginLedgerRow } from './marginLedgerRow';

export interface MarginLedgerReport {
  branch_id: string;
  cost_basis: string;
  /** @nullable */
  from?: string | null;
  rows: MarginLedgerRow[];
  /** Rows whose cost is unknown under the chosen basis (they ARE in `rows`). */
  rows_cost_unknown: number;
  target_pct: number;
  /** `branch` | `org` | `default`. */
  target_source: string;
  /** @nullable */
  to?: string | null;
  totals: LedgerTotals;
}
