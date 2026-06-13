/* eslint-disable */
// @ts-nocheck
import type { PublicCategoryNameTranslations } from './publicCategoryNameTranslations';
import type { PublicMenuItem } from './publicMenuItem';

export interface PublicCategory {
  id: string;
  /** @nullable */
  image_url?: string | null;
  items: PublicMenuItem[];
  name: string;
  name_translations: PublicCategoryNameTranslations;
}
