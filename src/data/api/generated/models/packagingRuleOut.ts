/* eslint-disable */
// @ts-nocheck
import type { PackagingRuleLineOut } from './packagingRuleLineOut';

export interface PackagingRuleOut {
  created_at: string;
  id: string;
  is_active: boolean;
  lines: PackagingRuleLineOut[];
  /**
     * Menu category (`categories.id`) the rule matches, or `null` = any.
     * @nullable
     */
  match_category_id?: string | null;
  /**
     * One menu item the rule matches, or `null` = any.
     * @nullable
     */
  match_item_id?: string | null;
  /**
     * Exact size label the rule matches (`Cup`, `Can`), or `null` = any.
     * @nullable
     */
  match_size_label?: string | null;
  name: string;
  org_id: string;
  sort: number;
  updated_at: string;
}
