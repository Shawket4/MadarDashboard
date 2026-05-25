/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { ItemSales } from './itemSales';

export interface CategorySales {
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  category_name?: string | null;
  item_count: number;
  items: ItemSales[];
  quantity_sold: number;
  revenue: number;
}
