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
};
