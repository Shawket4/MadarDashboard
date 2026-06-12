/* eslint-disable */
// @ts-nocheck
import type { PublicAddonItemNameTranslations } from './publicAddonItemNameTranslations';

export interface PublicAddonItem {
  default_price: number;
  id: string;
  name: string;
  name_translations: PublicAddonItemNameTranslations;
}
