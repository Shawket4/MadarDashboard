/* eslint-disable */
// @ts-nocheck
import type { MenuDisplayModifierGroupNameTranslations } from './menuDisplayModifierGroupNameTranslations';
import type { MenuDisplayModifierOption } from './menuDisplayModifierOption';

/**
 * A per-item modifier group, constraints resolved, by name.
 */
export interface MenuDisplayModifierGroup {
  /** @nullable */
  addon_type?: string | null;
  group_id: string;
  is_required: boolean;
  /** @nullable */
  max_selections?: number | null;
  min_selections: number;
  name: string;
  name_translations: MenuDisplayModifierGroupNameTranslations;
  options: MenuDisplayModifierOption[];
  /** "single" | "multi". */
  selection_type: string;
}
