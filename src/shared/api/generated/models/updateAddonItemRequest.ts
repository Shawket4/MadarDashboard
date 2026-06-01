/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { UpdateAddonItemRequestNameTranslations } from './updateAddonItemRequestNameTranslations';

export interface UpdateAddonItemRequest {
  /** @nullable */
  addon_type?: string | null;
  /** @nullable */
  default_price?: number | null;
  /** @nullable */
  display_order?: number | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  name_translations?: UpdateAddonItemRequestNameTranslations;
}
