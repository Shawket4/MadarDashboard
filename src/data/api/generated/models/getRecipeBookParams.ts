/* eslint-disable */
// @ts-nocheck

export type GetRecipeBookParams = {
org_id: string;
/**
 * @nullable
 */
category_id?: string | null;
/**
 * Case-insensitive filter on the item name (as `/costing/catalog`).
 * @nullable
 */
search?: string | null;
/**
 * `true` → only items with a recipe on some size; `false` → only items
 * with none; absent → all.
 * @nullable
 */
has_recipe?: boolean | null;
};
