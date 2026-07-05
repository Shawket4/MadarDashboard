/* eslint-disable */
// @ts-nocheck
import type { Signal } from './signal';

export interface MarginLedgerRow {
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  category_name?: string | null;
  /**
     * Classic menu-engineering class (Kasavana–Smith): `star` | `workhorse` |
     * `challenge` | `dog`. High/low popularity splits at the 70%-rule
     * threshold (0.70/n of tracked units); high/low profit splits at the
     * weighted-average unit contribution margin. `null` for rows that can't
     * be classified (no sales in the period, or cost unknown).
     * @nullable
     */
  class?: string | null;
  /**
     * Piastres under the chosen basis; `null` = unknown (never 0).
     * @nullable
     */
  cost?: number | null;
  flags: Signal[];
  item_name: string;
  /** @nullable */
  margin?: number | null;
  /** @nullable */
  margin_pct?: number | null;
  /**
     * This row's share of the total KNOWN margin (null when margin unknown
     * or total margin ≤ 0).
     * @nullable
     */
  margin_share_pct?: number | null;
  menu_item_id: string;
  /**
     * False when this SKU no longer exists on the active menu (historical
     * sales under a removed size/item).
     */
  on_menu: boolean;
  /**
     * This SKU's share of tracked units (the popularity axis), when classified.
     * @nullable
     */
  popularity_pct?: number | null;
  /** @nullable */
  prev_margin?: number | null;
  /** Previous equal-length period, for the trend column. */
  prev_quantity: number;
  quantity_sold: number;
  revenue: number;
  /** `"one_size"` for items without sizes. */
  size_label: string;
}
