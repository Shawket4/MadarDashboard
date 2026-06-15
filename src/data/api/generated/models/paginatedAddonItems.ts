/* eslint-disable */
// @ts-nocheck
import type { AddonItem } from './addonItem';

export interface PaginatedAddonItems {
  data: AddonItem[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
