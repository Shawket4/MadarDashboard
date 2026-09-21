/* eslint-disable */
// @ts-nocheck
import type { PackagingRuleLineInput } from './packagingRuleLineInput';

export interface CreatePackagingRuleRequest {
  /** @nullable */
  is_active?: boolean | null;
  lines: PackagingRuleLineInput[];
  /** @nullable */
  match_category_id?: string | null;
  /** @nullable */
  match_item_id?: string | null;
  /** @nullable */
  match_size_label?: string | null;
  name: string;
  /** @nullable */
  sort?: number | null;
}
