/* eslint-disable */
// @ts-nocheck
import type { ComboDescriptionTranslations } from './comboDescriptionTranslations';
import type { ComboEconomics } from './comboEconomics';
import type { ComboNameTranslations } from './comboNameTranslations';
import type { ComboSlot } from './comboSlot';
import type { SaleWindow } from './saleWindow';

/**
 * `GET /combos/{id}`, `POST /combos`, `PUT /combos/{id}`.
 */
export interface Combo {
  /**
     * Sellable right now on the till at the requested branch (or anywhere,
     * org-level): active, the POS channel on, a window open, every required
     * slot with an available choice.
     */
  available_now: boolean;
  /** @nullable */
  category_id?: string | null;
  created_at: string;
  /** @nullable */
  description?: string | null;
  description_translations: ComboDescriptionTranslations;
  economics: ComboEconomics;
  id: string;
  /** @nullable */
  image_url?: string | null;
  is_active: boolean;
  /** C1's fixed bundle: every slot has exactly one item choice with min == max. */
  is_fixed: boolean;
  /** Always `combo`. */
  kind: string;
  name: string;
  name_translations: ComboNameTranslations;
  /** P, piastres (the catalogue price; branch prices live in `/menu/pricing`). */
  price: number;
  slots: ComboSlot[];
  updated_at: string;
  windows: SaleWindow[];
}
