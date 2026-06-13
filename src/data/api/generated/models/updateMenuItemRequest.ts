/* eslint-disable */
// @ts-nocheck
import type { UpdateMenuItemRequestDescriptionTranslations } from './updateMenuItemRequestDescriptionTranslations';
import type { UpdateMenuItemRequestNameTranslations } from './updateMenuItemRequestNameTranslations';

export interface UpdateMenuItemRequest {
  /** @nullable */
  base_price?: number | null;
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  description?: string | null;
  /** @nullable */
  description_translations?: UpdateMenuItemRequestDescriptionTranslations;
  /** @nullable */
  image_url?: string | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  name_translations?: UpdateMenuItemRequestNameTranslations;
}
