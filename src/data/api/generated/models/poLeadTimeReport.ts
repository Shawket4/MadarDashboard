/* eslint-disable */
// @ts-nocheck
import type { PoLeadTimeRow } from './poLeadTimeRow';

export interface PoLeadTimeReport {
  by_supplier: PoLeadTimeRow[];
  /** @nullable */
  from?: string | null;
  overall_avg_days: number;
  /** @nullable */
  to?: string | null;
}
