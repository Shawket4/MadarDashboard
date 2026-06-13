/* eslint-disable */
// @ts-nocheck
import type { CreateOptionalFieldRequestNameTranslations } from './createOptionalFieldRequestNameTranslations';

export interface CreateOptionalFieldRequest {
  /** @nullable */
  ingredient_name?: string | null;
  /** @nullable */
  ingredient_unit?: string | null;
  name: string;
  /** @nullable */
  name_translations?: CreateOptionalFieldRequestNameTranslations;
  /** @nullable */
  org_ingredient_id?: string | null;
  /** @nullable */
  price?: number | null;
  /** @nullable */
  quantity_used?: number | null;
  /** @nullable */
  size_label?: string | null;
}
