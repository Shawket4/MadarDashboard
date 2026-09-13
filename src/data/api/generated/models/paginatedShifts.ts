/* eslint-disable */
// @ts-nocheck
import type { Shift } from './shift';

export interface PaginatedShifts {
  data: Shift[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
