/* eslint-disable */
// @ts-nocheck
import type { SpotViewApproval } from './spotViewApproval';

export interface SpotViewRequest {
  approval?: null | SpotViewApproval;
  /**
     * Set by replay from a verified envelope approval (ignored live).
     * @nullable
     */
  approval_id?: string | null;
  /**
     * Set by replay from a verified envelope approval (ignored live).
     * @nullable
     */
  approved_by?: string | null;
  /** @nullable */
  device_id?: string | null;
  /**
     * Client-minted id; a retry, a replay or the print of the same view is one row.
     * @nullable
     */
  id?: string | null;
  /** The spot report was printed. */
  printed?: boolean;
  /** @nullable */
  printed_at?: string | null;
  /** @nullable */
  viewed_at?: string | null;
}
