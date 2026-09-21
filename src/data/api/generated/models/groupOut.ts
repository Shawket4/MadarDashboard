/* eslint-disable */
// @ts-nocheck
import type { GroupOptionOut } from './groupOptionOut';

/**
 * A reusable modifier group with its options (org-scoped catalog view).
 */
export interface GroupOut {
  /** What choosing does: `none` | `adds` | `swaps`. */
  effect: string;
  id: string;
  is_active: boolean;
  is_required: boolean;
  /** @nullable */
  legacy_addon_type?: string | null;
  /** @nullable */
  max_selections?: number | null;
  min_selections: number;
  name: string;
  name_translations: unknown;
  options: GroupOptionOut[];
  org_id: string;
  selection_type: string;
  sort: number;
  /**
     * For `swaps`: the ingredient category whose recipe line each option replaces.
     * @nullable
     */
  swap_category_id?: string | null;
  /** @nullable */
  swap_category_slug?: string | null;
}
