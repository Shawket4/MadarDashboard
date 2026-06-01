/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { PublicAddonItem } from './publicAddonItem';
import type { PublicAddonSlotLabelTranslations } from './publicAddonSlotLabelTranslations';

export interface PublicAddonSlot {
  addon_items: PublicAddonItem[];
  addon_type: string;
  id: string;
  is_required: boolean;
  /** @nullable */
  label?: string | null;
  label_translations: PublicAddonSlotLabelTranslations;
  /** @nullable */
  max_selections?: number | null;
  min_selections: number;
}
