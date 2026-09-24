/* eslint-disable */
// @ts-nocheck

/**
 * How a sale line of this item is priced at the requested branch:
 * madar-catalog's `ItemView` (sizes with their branch prices, the
 * branch's item price, the recipe's swap bases and their candidates, the
 * optional fields). The till prices with it exactly as the order path
 * does. Present on `?full=true` lists; additive, older tills ignore it.
 * @nullable
 */
export type MenuItemFullPricing = { [key: string]: unknown } | null;
