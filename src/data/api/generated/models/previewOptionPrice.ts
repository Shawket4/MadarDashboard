/* eslint-disable */
// @ts-nocheck

export interface PreviewOptionPrice {
  name: string;
  option_id: string;
  /** Piastres added to one unit (swap = difference over the default). */
  price_delta: number;
  /** `swap over <default>` | `adds` | `none`. */
  reason: string;
}
