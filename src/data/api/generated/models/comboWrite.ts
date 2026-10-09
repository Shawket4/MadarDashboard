/* eslint-disable */
// @ts-nocheck
import type { ComboSlotWrite } from './comboSlotWrite';
import type { ComboWriteDescriptionTranslations } from './comboWriteDescriptionTranslations';
import type { ComboWriteNameTranslations } from './comboWriteNameTranslations';
import type { SaleWindow } from './saleWindow';

/**
 * `POST /combos`, `PUT /combos/{id}`, `POST /combos/economics`.
 */
export interface ComboWrite {
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  description?: string | null;
  description_translations?: ComboWriteDescriptionTranslations;
  is_active?: boolean;
  name: string;
  name_translations?: ComboWriteNameTranslations;
  /** P, piastres: the combo's `one_size` price (its `base_price`). */
  price: number;
  slots: ComboSlotWrite[];
  windows?: SaleWindow[];
}
