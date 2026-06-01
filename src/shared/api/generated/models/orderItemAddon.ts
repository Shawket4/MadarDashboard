/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { OrderItemAddonNameTranslations } from './orderItemAddonNameTranslations';

export interface OrderItemAddon {
  addon_item_id: string;
  addon_name: string;
  id: string;
  line_total: number;
  name_translations: OrderItemAddonNameTranslations;
  order_item_id: string;
  quantity: number;
  unit_price: number;
}
