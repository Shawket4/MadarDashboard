/* eslint-disable */
// @ts-nocheck
import type { CreateAddonItemRequestNameTranslations } from './createAddonItemRequestNameTranslations';

export interface CreateAddonItemRequest {
  addon_type: string;
  default_price: number;
  /** @nullable */
  display_order?: number | null;
  name: string;
  /** @nullable */
  name_translations?: CreateAddonItemRequestNameTranslations;
  org_id: string;
}
