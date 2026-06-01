/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { CombinedItemSalesRowItemNameTranslations } from './combinedItemSalesRowItemNameTranslations';

export interface CombinedItemSalesRow {
  bundle_qty: number;
  /** @nullable */
  item_id?: string | null;
  item_name: string;
  item_name_translations: CombinedItemSalesRowItemNameTranslations;
  standalone_qty: number;
  total_qty: number;
}
