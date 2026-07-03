/* eslint-disable */
// @ts-nocheck
import type { ModifierOptionOut } from './modifierOptionOut';

/**
 * A reusable modifier group attached to this item, with min/max/required resolved
 * from the attachment overrides (falling back to the group defaults).
 */
export interface ModifierGroupOut {
  attachment_id: string;
  group_id: string;
  is_required: boolean;
  /** @nullable */
  legacy_addon_type?: string | null;
  /** @nullable */
  max?: number | null;
  min: number;
  name: string;
  name_translations: unknown;
  options: ModifierOptionOut[];
  selection_type: string;
  sort: number;
}
