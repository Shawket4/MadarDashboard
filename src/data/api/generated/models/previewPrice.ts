/* eslint-disable */
// @ts-nocheck
import type { PreviewOptionPrice } from './previewOptionPrice';

export interface PreviewPrice {
  /** Unit price of the item/size, piastres. */
  base: number;
  options: PreviewOptionPrice[];
  /** (base + options) × quantity, piastres. */
  total: number;
}
