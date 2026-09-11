/* eslint-disable */
// @ts-nocheck

/**
 * What the storefront needs to render a bill honestly: the rate, and whether
 * the menu prices already contain it. Sent with the branch list and with every
 * quote so a page can show a tax line (exclusive) or an "includes VAT" note
 * (inclusive) instead of quietly under-quoting. No service-charge fields: an
 * online order never carries one, and a field that is always zero invites a
 * page to render a line for it.
 */
export interface OnlineTaxPolicy {
  /** `true` = menu prices already contain the tax; the total will not grow. */
  tax_inclusive: boolean;
  /** Fraction, NOT a percentage: `0.14` is 14%. */
  tax_rate: number;
}
