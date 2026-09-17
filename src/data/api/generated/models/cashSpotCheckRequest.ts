/* eslint-disable */
// @ts-nocheck
import type { SpotCheckMethodInput } from './spotCheckMethodInput';

export interface CashSpotCheckRequest {
  /**
     * Replay only: the approval id carried on the envelope (ignored live).
     * @nullable
     */
  approval_id?: string | null;
  /**
     * Replay only: the person whose PIN unlocked this check (ignored live).
     * @nullable
     */
  approved_by?: string | null;
  /** @nullable */
  checked_at?: string | null;
  /** The cash counted in the drawer, minor units. */
  counted_cash: number;
  /** @nullable */
  device_id?: string | null;
  /**
     * The expected cash the counter saw. Absent → the server computes it now.
     * @nullable
     */
  expected_cash?: number | null;
  /**
     * Client-minted id; a retried or replayed check with the same id is one check.
     * @nullable
     */
  id?: string | null;
  /**
     * Per-method expected / counted figures. Absent → the server's own totals, uncounted.
     * @nullable
     */
  methods?: SpotCheckMethodInput[] | null;
  /** @nullable */
  note?: string | null;
}
