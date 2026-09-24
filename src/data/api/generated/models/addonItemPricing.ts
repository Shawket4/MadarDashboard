/* eslint-disable */
// @ts-nocheck

/**
 * How a sale line charges this option: madar-catalog's `OptionView`
 * (branch-effective price, its group's effect and swap category, the
 * ingredient it replaces, its lines per size). The till prices lines with
 * it exactly as the order path does. Additive; older tills ignore it.
 * @nullable
 */
export type AddonItemPricing = { [key: string]: unknown } | null;
