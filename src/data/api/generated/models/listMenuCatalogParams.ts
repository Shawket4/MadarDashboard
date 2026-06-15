/* eslint-disable */
// @ts-nocheck

export type ListMenuCatalogParams = {
org_id: string;
category_id?: string;
/**
 * Case-insensitive filter on the item name.
 */
search?: string;
/**
 * 1-based page number (default 1).
 */
page?: number;
/**
 * Page size (default 50, max 500).
 */
per_page?: number;
/**
 * When set, enables the per-branch override filter/sort (LEFT JOINs the
 * branch's overrides). Prices in the response stay org-level.
 */
branch_id?: string;
/**
 * With `branch_id`: true → only items overridden at the branch; false →
 * only un-overridden; null → all.
 */
overridden?: boolean;
/**
 * `"overridden"` → overridden items first (needs `branch_id`); otherwise A–Z.
 */
sort?: string;
};
