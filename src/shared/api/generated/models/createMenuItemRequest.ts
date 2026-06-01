/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { CreateMenuItemRequestDescriptionTranslations } from './createMenuItemRequestDescriptionTranslations';
import type { CreateMenuItemRequestNameTranslations } from './createMenuItemRequestNameTranslations';

export interface CreateMenuItemRequest {
  base_price: number;
  category_id: string;
  /** @nullable */
  description?: string | null;
  /** @nullable */
  description_translations?: CreateMenuItemRequestDescriptionTranslations;
  /** @nullable */
  display_order?: number | null;
  /** @nullable */
  image_url?: string | null;
  name: string;
  /** @nullable */
  name_translations?: CreateMenuItemRequestNameTranslations;
  org_id: string;
}
