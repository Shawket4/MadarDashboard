/* eslint-disable */
// @ts-nocheck
import type { SyncModifierGroupNameTranslations } from './syncModifierGroupNameTranslations';
import type { SyncOption } from './syncOption';

/**
 * A modifier group attached to an item, with min/max/required resolved from the
 * attachment overrides (falling back to the group defaults).
 */
export interface SyncModifierGroup {
  group_id: string;
  is_required: boolean;
  /** @nullable */
  legacy_addon_type?: string | null;
  /** @nullable */
  max?: number | null;
  min: number;
  /** The group's authored display name (custom groups have no legacy type —
   * this is what the POS renders as the section title). */
  name: string;
  name_translations: SyncModifierGroupNameTranslations;
  options: SyncOption[];
  selection_type: string;
}
