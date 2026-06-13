/* eslint-disable */
// @ts-nocheck
import type { CreateCategoryRequestNameTranslations } from './createCategoryRequestNameTranslations';

export interface CreateCategoryRequest {
  /** @nullable */
  image_url?: string | null;
  name: string;
  /** @nullable */
  name_translations?: CreateCategoryRequestNameTranslations;
  org_id: string;
}
