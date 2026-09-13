/* eslint-disable */
// @ts-nocheck
import type { Till } from './till';

export interface PaginatedTills {
  data: Till[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
