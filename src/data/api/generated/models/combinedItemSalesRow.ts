/* eslint-disable */
// @ts-nocheck
import type { CombinedItemSalesRowItemNameTranslations } from './combinedItemSalesRowItemNameTranslations';

export interface CombinedItemSalesRow {
  item_id: string;
  item_name: string;
  item_name_translations: CombinedItemSalesRowItemNameTranslations;
  /**
     * Equal to `total_qty` since combos were removed (it used to exclude
     * units sold inside a combo). Kept so dashboards built before still render.
     */
  standalone_qty: number;
  total_qty: number;
}
