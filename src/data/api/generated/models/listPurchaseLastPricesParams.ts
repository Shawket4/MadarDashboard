/* eslint-disable */
// @ts-nocheck

export type ListPurchaseLastPricesParams = {
/**
 * The supplier the order is for. Its own last price wins; when it never
 * sold the ingredient (or none is given) the last price from any supplier
 * is returned, with `source = "any"`.
 */
supplier_id?: string;
/**
 * Comma-separated ingredient ids. Omitted: every ingredient the org has
 * ever put on a purchase order.
 */
ingredient_ids?: string;
};
