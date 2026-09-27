/* eslint-disable */
// @ts-nocheck
import type { MixPick } from './mixPick';
import type { MixSlotNameTranslations } from './mixSlotNameTranslations';

export interface MixSlot {
  name: string;
  /**
     * The slot's names by language: the catalogue's when it has any, else
     * what the sales stored (a deleted slot's). `{}` when neither has any.
     */
  name_translations?: MixSlotNameTranslations;
  picks: MixPick[];
  /**
     * `null` for parts whose slot was deleted since.
     * @nullable
     */
  slot_id?: string | null;
}
