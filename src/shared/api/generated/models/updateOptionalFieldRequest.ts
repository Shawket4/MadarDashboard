/* eslint-disable */
// @ts-nocheck
import type { UpdateOptionalFieldRequestNameTranslations } from './updateOptionalFieldRequestNameTranslations';

export interface UpdateOptionalFieldRequest {
  /** @nullable */
  display_order?: number | null;
  /** @nullable */
  ingredient_name?: string | null;
  /** @nullable */
  ingredient_unit?: string | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  name_translations?: UpdateOptionalFieldRequestNameTranslations;
  /** @nullable */
  org_ingredient_id?: string | null;
  /** @nullable */
  price?: number | null;
  /** @nullable */
  quantity_used?: number | null;
  /** @nullable */
  size_label?: string | null;
}
