/* eslint-disable */
// @ts-nocheck
import type { MixPickNameTranslations } from './mixPickNameTranslations';

export interface MixPick {
  /** Units picked (Σ part quantity, refunds netted). */
  count: number;
  /** @nullable */
  menu_item_id?: string | null;
  name: string;
  name_translations: MixPickNameTranslations;
  /** @nullable */
  size_label?: string | null;
  surcharge_total: number;
}
