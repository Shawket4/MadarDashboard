/* eslint-disable */
// @ts-nocheck

/**
 * A manager's approval carried by a queued op (PERMISSIONS_ARCHITECTURE §4.2),
 * or — the same shape — a live request's one-time manager-PIN unlock (owner,
 * 2026-09-17). `Serialize` + `ToSchema` are for the live half: the offline
 * queue only ever deserializes one from the wire.
 */
export interface ReplayApproval {
  /** @nullable */
  amount_minor?: number | null;
  approver_id: string;
  /** Capability key, e.g. `orders.void`. */
  capability: string;
  id: string;
  /**
     * Basis points, for an act capped by `max_percent` (a discount). Additive.
     * @nullable
     */
  percent_bps?: number | null;
  /**
     * The value an approval covered (`max_value` limits, e.g. a waste).
     * @nullable
     */
  value_minor?: number | null;
}
