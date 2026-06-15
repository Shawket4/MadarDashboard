/* eslint-disable */
// @ts-nocheck
import type { AddonInput } from './addonInput';

/**
 * One line of a public cart. Prices are NOT taken from the client — the server
 * resolves them. `addons` reuses [`AddonInput`] but its `unit_price` is ignored.
 */
export interface CartLineInput {
  addons?: AddonInput[];
  menu_item_id: string;
  /** @nullable */
  notes?: string | null;
  optional_field_ids?: string[];
  quantity: number;
  /** @nullable */
  size_label?: string | null;
}
