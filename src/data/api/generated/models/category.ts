/* eslint-disable */
// @ts-nocheck
import type { AssetGroupRef } from './assetGroupRef';
import type { CategoryNameTranslations } from './categoryNameTranslations';

export interface Category {
  created_at: string;
  /** @nullable */
  deleted_at?: string | null;
  /**
     * Drag-and-drop position (lower first); ties break on name. Set via
     * `PUT /categories/order`.
     */
  display_order: number;
  id: string;
  image?: null | AssetGroupRef;
  /** @nullable */
  image_url?: string | null;
  is_active: boolean;
  name: string;
  name_translations: CategoryNameTranslations;
  org_id: string;
  updated_at: string;
}
