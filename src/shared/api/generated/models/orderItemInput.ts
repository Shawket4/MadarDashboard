/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { AddonInput } from './addonInput';
import type { BundleComponentInput } from './bundleComponentInput';

export interface OrderItemInput {
  addons: AddonInput[];
  bundle_components?: BundleComponentInput[];
  /** @nullable */
  bundle_id?: string | null;
  /** @nullable */
  menu_item_id?: string | null;
  /** @nullable */
  notes?: string | null;
  optional_field_ids: string[];
  quantity: number;
  /** @nullable */
  size_label?: string | null;
}
