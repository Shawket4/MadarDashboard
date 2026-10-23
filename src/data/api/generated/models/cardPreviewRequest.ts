/* eslint-disable */
// @ts-nocheck
import type { CardDesign } from './cardDesign';
import type { PreviewBalance } from './previewBalance';
import type { Store } from './store';

/**
 * Render a design as the wallet will get it.
 */
export interface CardPreviewRequest {
  arabic?: boolean;
  /** Sample balances per track (`{position, balance}`); absent = half full. */
  balances?: PreviewBalance[];
  design: CardDesign;
  store: Store;
}
