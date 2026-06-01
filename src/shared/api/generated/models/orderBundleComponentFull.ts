/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { OrderBundleComponentAddon } from './orderBundleComponentAddon';
import type { OrderBundleComponentFullNameTranslations } from './orderBundleComponentFullNameTranslations';
import type { OrderBundleComponentOptional } from './orderBundleComponentOptional';

export interface OrderBundleComponentFull {
  addons: OrderBundleComponentAddon[];
  item_id: string;
  item_name: string;
  name_translations: OrderBundleComponentFullNameTranslations;
  optionals: OrderBundleComponentOptional[];
  quantity: number;
  /** @nullable */
  size_label?: string | null;
}
