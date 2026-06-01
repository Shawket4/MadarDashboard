/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { AddonSalesRowAddonNameTranslations } from './addonSalesRowAddonNameTranslations';

export interface AddonSalesRow {
  addon_item_id: string;
  addon_name: string;
  addon_name_translations: AddonSalesRowAddonNameTranslations;
  addon_type: string;
  quantity_sold: number;
  revenue: number;
}
