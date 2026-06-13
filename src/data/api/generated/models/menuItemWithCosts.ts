/* eslint-disable */
// @ts-nocheck
import type { MenuItem } from './menuItem';
import type { SkuCost } from './skuCost';

/**
 * A menu item with its per-SKU recipe-cost rollup embedded, so the catalog
 * list needs no separate `/costing/menu-items` round trip. `sku_costs` is one
 * row per sellable size (or a single `one_size` row); empty when the item is
 * inactive or has no recipe.
 */
export type MenuItemWithCosts = MenuItem & {
  sku_costs: SkuCost[];
};
