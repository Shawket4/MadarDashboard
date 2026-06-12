/* eslint-disable */
// @ts-nocheck
import type { AddonInput } from './addonInput';

export interface BundleComponentInput {
  addons?: AddonInput[];
  item_id: string;
  optional_field_ids?: string[];
  quantity: number;
  /** @nullable */
  size_label?: string | null;
}
