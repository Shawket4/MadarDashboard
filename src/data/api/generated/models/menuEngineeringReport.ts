/* eslint-disable */
// @ts-nocheck
import type { MenuEngineeringRow } from './menuEngineeringRow';

export interface MenuEngineeringReport {
  branch_id: string;
  /** Cost basis the report was computed with: "snapshot" | "current". */
  cost_basis: string;
  /** Realized revenue (piastres) carried by the excluded SKUs — explains
   * why `total_sales` differs between cost bases: each basis excludes a
   * different set of un-costable rows. */
  excluded_sales: number;
  /** @nullable */
  from?: string | null;
  rows: MenuEngineeringRow[];
  /** SKUs sold in the window but EXCLUDED from this report because their
   * cost was unresolvable under the chosen basis. */
  rows_cost_missing: number;
  /** @nullable */
  to?: string | null;
  total_cost: number;
  total_profit: number;
  /** Totals over the returned rows. */
  total_sales: number;
}
