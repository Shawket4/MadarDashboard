/* eslint-disable */
// @ts-nocheck
import type { CategorySalesCategoryNameTranslations } from './categorySalesCategoryNameTranslations';
import type { ItemSales } from './itemSales';

export interface CategorySales {
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  category_name?: string | null;
  category_name_translations: CategorySalesCategoryNameTranslations;
  item_count: number;
  items: ItemSales[];
  quantity_sold: number;
  revenue: number;
}
