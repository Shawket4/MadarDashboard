/* eslint-disable */
// @ts-nocheck
import type { PackagingRuleLineInput } from './packagingRuleLineInput';

/**
 * Partial update. A match field is replaced only when its key is present
 * (`null` clears it); `lines`, when present, replaces the whole set.
 */
export interface PatchPackagingRuleRequest {
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  lines?: PackagingRuleLineInput[] | null;
  /** @nullable */
  match_category_id?: string | null;
  /** @nullable */
  match_item_id?: string | null;
  /** @nullable */
  match_size_label?: string | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  sort?: number | null;
}
