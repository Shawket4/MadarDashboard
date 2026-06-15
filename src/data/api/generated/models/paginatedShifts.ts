/* eslint-disable */
// @ts-nocheck
import type { Shift } from './shift';

/**
 * Paginated envelope for the shifts list. When the request omits `page`/`per_page`,
 * `data` holds every matching shift in one page (back-compat for the dashboard);
 * when they are present, `data` is one bounded page ordered newest-first.
 */
export interface PaginatedShifts {
  data: Shift[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
