/* eslint-disable */
// @ts-nocheck
import type { CreateBundleComponentInput } from './createBundleComponentInput';

export interface UpdateBundleRequest {
  /** @nullable */
  available_from_date?: string | null;
  /**
     * `null`  → clear the field (no start time restriction)
   * omitted → keep the existing value
   * a value → set to that time
     * @nullable
     */
  available_from_time?: string | null;
  /** @nullable */
  available_until_date?: string | null;
  /** @nullable */
  available_until_time?: string | null;
  /** @nullable */
  branch_ids?: string[] | null;
  /** @nullable */
  components?: CreateBundleComponentInput[] | null;
  /** @nullable */
  description?: string | null;
  description_translations?: unknown;
  /** @nullable */
  display_order?: number | null;
  /** @nullable */
  image_url?: string | null;
  /** @nullable */
  name?: string | null;
  name_translations?: unknown;
  /** @nullable */
  price?: number | null;
}
