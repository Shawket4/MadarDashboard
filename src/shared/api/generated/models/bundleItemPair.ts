/* eslint-disable */
// @ts-nocheck
import type { ItemKey } from './itemKey';

export interface BundleItemPair {
  /** Directional: P(item_b in basket | item_a in basket), item_a = focus. */
  confidence_ab: number;
  item_a: ItemKey;
  item_b: ItemKey;
  lift: number;
  support: number;
}
