/* eslint-disable */
// @ts-nocheck
import type { MenuDisplayComboChoice } from './menuDisplayComboChoice';
import type { MenuDisplayComboSlotNameTranslations } from './menuDisplayComboSlotNameTranslations';

export interface MenuDisplayComboSlot {
  choices: MenuDisplayComboChoice[];
  /** @nullable */
  default_item_id?: string | null;
  /** @nullable */
  default_size_label?: string | null;
  id: string;
  max: number;
  min: number;
  name: string;
  name_translations: MenuDisplayComboSlotNameTranslations;
  sort: number;
}
