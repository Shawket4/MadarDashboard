/* eslint-disable */
// @ts-nocheck
import type { MenuItemWithCosts } from './menuItemWithCosts';

export interface PaginatedMenuItems {
  data: MenuItemWithCosts[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
