/* eslint-disable */
// @ts-nocheck
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
  /**
     * Charged unit price (piastres) the POS applied for this item/bundle line. When
   * present it is RECORDED as the line's unit_price; absent → the server's expected
   * (catalog + branch override) price is used. Recording what the customer was
   * actually charged keeps the DB equal to the printed receipt even when the POS's
   * synced menu/override prices are stale or it was offline at sale time.
     * @nullable
     */
  unit_price?: number | null;
}
