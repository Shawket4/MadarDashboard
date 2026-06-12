/* eslint-disable */
// @ts-nocheck
import type { AddonSlotLabelTranslations } from './addonSlotLabelTranslations';

export interface AddonSlot {
  addon_type: string;
  created_at: string;
  display_order: number;
  id: string;
  is_required: boolean;
  /** @nullable */
  label?: string | null;
  label_translations: AddonSlotLabelTranslations;
  /** @nullable */
  max_selections?: number | null;
  menu_item_id: string;
  min_selections: number;
}
