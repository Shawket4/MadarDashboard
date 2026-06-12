/* eslint-disable */
// @ts-nocheck
import type { BundleWithComponents } from './bundleWithComponents';

export interface PaginatedBundles {
  data: BundleWithComponents[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
