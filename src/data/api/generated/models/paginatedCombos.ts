/* eslint-disable */
// @ts-nocheck
import type { ComboSummary } from './comboSummary';

export interface PaginatedCombos {
  data: ComboSummary[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
