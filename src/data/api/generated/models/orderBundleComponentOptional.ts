/* eslint-disable */
// @ts-nocheck
import type { OrderBundleComponentOptionalNameTranslations } from './orderBundleComponentOptionalNameTranslations';

export interface OrderBundleComponentOptional {
  component_item_id: string;
  field_name: string;
  id: string;
  name_translations: OrderBundleComponentOptionalNameTranslations;
  /** @nullable */
  optional_field_id?: string | null;
  order_line_id: string;
  price: number;
}
