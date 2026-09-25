/* eslint-disable */
// @ts-nocheck
import type { ComboChoice } from './comboChoice';
import type { ComboSlotNameTranslations } from './comboSlotNameTranslations';

export interface ComboSlot {
  choices: ComboChoice[];
  /** @nullable */
  default_item_id?: string | null;
  /** @nullable */
  default_size_label?: string | null;
  id: string;
  max: number;
  min: number;
  name: string;
  name_translations: ComboSlotNameTranslations;
  sort: number;
}
