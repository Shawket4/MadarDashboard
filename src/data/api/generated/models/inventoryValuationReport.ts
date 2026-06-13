/* eslint-disable */
// @ts-nocheck
import type { ValuationRow } from './valuationRow';

export interface InventoryValuationReport {
  items: ValuationRow[];
  total_value: number;
  unknown_cost_count: number;
}
