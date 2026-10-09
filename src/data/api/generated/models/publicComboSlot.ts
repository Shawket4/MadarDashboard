/* eslint-disable */
// @ts-nocheck
import type { PublicComboChoice } from './publicComboChoice';
import type { PublicComboSlotNameTranslations } from './publicComboSlotNameTranslations';

export interface PublicComboSlot {
  choices: PublicComboChoice[];
  /** @nullable */
  default_item_id?: string | null;
  /** @nullable */
  default_size_label?: string | null;
  id: string;
  max: number;
  min: number;
  name: string;
  name_translations: PublicComboSlotNameTranslations;
  sort: number;
}
