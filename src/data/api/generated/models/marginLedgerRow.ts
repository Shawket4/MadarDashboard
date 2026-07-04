/* eslint-disable */
// @ts-nocheck
import type { Signal } from './signal';

export interface MarginLedgerRow {
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  category_name?: string | null;
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
  /** @nullable */
  prev_margin?: number | null;
  /** Previous equal-length period, for the trend column. */
  prev_quantity: number;
  quantity_sold: number;
  revenue: number;
  /** `"one_size"` for items without sizes. */
  size_label: string;
}
