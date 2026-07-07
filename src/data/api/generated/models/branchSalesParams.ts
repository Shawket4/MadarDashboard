/* eslint-disable */
// @ts-nocheck

export type BranchSalesParams = {
from?: string;
to?: string;
limit?: number;
/**
 * Comma-separated menu_item/bundle UUIDs left out of `total_line_items`
 * (units sold) ONLY — revenue, top items, and categories are untouched.
 */
exclude_items?: string;
};
