/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { OrderBundleComponentAddonNameTranslations } from './orderBundleComponentAddonNameTranslations';

export interface OrderBundleComponentAddon {
  addon_item_id: string;
  addon_name: string;
  component_item_id: string;
  id: string;
  line_total: number;
  name_translations: OrderBundleComponentAddonNameTranslations;
  order_line_id: string;
  quantity: number;
  unit_price: number;
}
