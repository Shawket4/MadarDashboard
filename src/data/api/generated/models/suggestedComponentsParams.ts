/* eslint-disable */
// @ts-nocheck

export type SuggestedComponentsParams = {
org_id: string;
/**
 * Comma-separated menu item IDs already added to the in-progress bundle.
 */
item_ids: string;
start_date?: string;
end_date?: string;
/**
 * Max suggestions to return. Default 10.
 */
limit?: number;
/**
 * Minimum number of orders an item must co-occur with the anchor set in
 * to be suggested. Default 3.
 */
min_count?: number;
};
