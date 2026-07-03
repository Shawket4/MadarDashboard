/* eslint-disable */
// @ts-nocheck
import type { GroupOptionOut } from './groupOptionOut';

/**
 * A reusable modifier group with its options (org-scoped catalog view).
 */
export interface GroupOut {
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
}
