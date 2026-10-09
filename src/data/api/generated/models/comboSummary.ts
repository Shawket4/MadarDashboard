/* eslint-disable */
// @ts-nocheck
import type { ComboSummaryNameTranslations } from './comboSummaryNameTranslations';

/**
 * One row of `GET /combos`.
 */
export interface ComboSummary {
  /** Org-level: active, a window open now (org time zone), POS channel on. */
  available_now: boolean;
  /** @nullable */
  category_id?: string | null;
  id: string;
  /** @nullable */
  image_url?: string | null;
  is_active: boolean;
  is_fixed: boolean;
  /** @nullable */
  margin_default?: string | null;
  name: string;
  name_translations: ComboSummaryNameTranslations;
  price: number;
  slot_count: number;
  warning_count: number;
  window_count: number;
}
