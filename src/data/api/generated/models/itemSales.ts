/* eslint-disable */
// @ts-nocheck
import type { ItemSalesItemNameTranslations } from './itemSalesItemNameTranslations';

export interface ItemSales {
  /**
     * Piastres per unit sold: `extras_total / quantity_sold`, rounded to the
     * piastre (half away from zero). Additive.
     * @nullable
     */
  avg_extra?: number | null;
  /**
     * Piastres charged on top of those size prices, before any discount:
     * every add-on and swap on the lines (their charge, a staff comp added
     * back) plus optional fields × quantity. `paid − menu price of the size`,
     * summed; never below zero (see `order_line_extras` in
     * migrations/20261023100000_rollup_item_extras.sql). Additive.
     * @nullable
     */
  extras_total?: number | null;
  item_name: string;
  item_name_translations: ItemSalesItemNameTranslations;
  menu_item_id: string;
  /**
     * Piastres: the menu price of the size each unit was sold in, AT SALE
     * TIME, summed (`order_items.unit_price × quantity`; no add-ons, swaps,
     * optional fields, discounts or rewards). Additive (2026-10-18): absent
     * from older servers.
     * @nullable
     */
  menu_total?: number | null;
  quantity_sold: number;
  revenue: number;
}
