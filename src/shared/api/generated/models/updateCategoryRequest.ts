/* eslint-disable */
// @ts-nocheck
import type { UpdateCategoryRequestNameTranslations } from './updateCategoryRequestNameTranslations';

export interface UpdateCategoryRequest {
  /** @nullable */
  display_order?: number | null;
  /** @nullable */
  image_url?: string | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  name_translations?: UpdateCategoryRequestNameTranslations;
}
