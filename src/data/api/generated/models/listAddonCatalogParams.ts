/* eslint-disable */
// @ts-nocheck

export type ListAddonCatalogParams = {
org_id: string;
addon_type?: string;
/**
 * Case-insensitive filter on the addon name.
 */
search?: string;
page?: number;
per_page?: number;
/**
 * Enables the per-branch override filter/sort (LEFT JOINs the branch's overrides).
 */
branch_id?: string;
/**
 * With `branch_id`: true → only addons overridden at the branch; false → only
 * un-overridden; null → all.
 */
overridden?: boolean;
/**
 * `"overridden"` → overridden addons first (needs `branch_id`); otherwise by type/name.
 */
sort?: string;
};
