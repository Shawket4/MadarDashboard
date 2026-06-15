/* eslint-disable */
// @ts-nocheck
import type { PublicCategory } from './publicCategory';
import type { PublicMenuItem } from './publicMenuItem';

export interface PublicMenu {
  categories: PublicCategory[];
  items: PublicMenuItem[];
}
