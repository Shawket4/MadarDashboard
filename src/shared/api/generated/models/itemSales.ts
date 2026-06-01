/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { ItemSalesItemNameTranslations } from './itemSalesItemNameTranslations';

export interface ItemSales {
  item_name: string;
  item_name_translations: ItemSalesItemNameTranslations;
  menu_item_id: string;
  quantity_sold: number;
  revenue: number;
}
