/* eslint-disable */
// @ts-nocheck

export interface MaterialCostTrendRow {
  /** Piastres per base stock unit, the receipt just before the streak began. */
  base_cost: number;
  /** @nullable */
  cheaper_cost?: number | null;
  /** @nullable */
  cheaper_supplier_id?: string | null;
  /** @nullable */
  cheaper_supplier_name?: string | null;
  /** Piastres per base stock unit, most recent receipt. */
  current_cost: number;
  /** @nullable */
  current_supplier_id?: string | null;
  current_supplier_name: string;
  ingredient_name: string;
  org_ingredient_id: string;
  /** `(current_cost - base_cost) / base_cost * 100`, 1 dp. */
  pct_increase: number;
  /**
     * Number of consecutive received deliveries, most recent first, each
     * pricier than the one before it.
     */
  streak_length: number;
}
