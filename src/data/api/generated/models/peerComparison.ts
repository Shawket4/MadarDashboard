/* eslint-disable */
// @ts-nocheck
import type { PeerPosition } from './peerPosition';

export interface PeerComparison {
  /** @nullable */
  median_cm_per_unit_peers?: number | null;
  median_effective_price_peers: number;
  /**
     * Only set when this item is CM-tracked AND peers are CM-tracked too.
     * @nullable
     */
  median_margin_pct_peers?: number | null;
  /** @minimum 0 */
  same_category_count: number;
  your_position: PeerPosition;
}
