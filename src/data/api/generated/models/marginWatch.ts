/* eslint-disable */
// @ts-nocheck
import type { LedgerTotals } from './ledgerTotals';
import type { MarginLedgerRow } from './marginLedgerRow';

export interface MarginWatch {
  /** Worst contributors (asc, only rows with known margin), max 3. */
  bottom: MarginLedgerRow[];
  branch_id: string;
  /** @nullable */
  from?: string | null;
  open_signals: number;
  rows_cost_unknown: number;
  target_pct: number;
  /** @nullable */
  to?: string | null;
  /** Top contributors by known margin (desc), max 3. */
  top: MarginLedgerRow[];
  totals: LedgerTotals;
}
