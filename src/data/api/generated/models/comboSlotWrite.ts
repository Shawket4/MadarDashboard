/* eslint-disable */
// @ts-nocheck
import type { ComboChoiceWrite } from './comboChoiceWrite';
import type { ComboSlotWriteNameTranslations } from './comboSlotWriteNameTranslations';

export interface ComboSlotWrite {
  choices: ComboChoiceWrite[];
  /**
     * Pre-selected on the till and used for unpicked replays; must be one of
     * the slot's choices (by id, or by its category).
     * @nullable
     */
  default_item_id?: string | null;
  /** @nullable */
  default_size_label?: string | null;
  /**
     * The slot's id, to keep it on an edit; omit for a new slot.
     * @nullable
     */
  id?: string | null;
  /** Picks allowed (1–10, ≥ min). */
  max: number;
  /** Picks required (0–10). 0 = optional slot. */
  min: number;
  name: string;
  name_translations?: ComboSlotWriteNameTranslations;
  sort?: number;
}
