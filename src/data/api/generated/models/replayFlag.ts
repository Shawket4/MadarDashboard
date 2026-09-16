/* eslint-disable */
// @ts-nocheck

/**
 * One offline act that was accepted despite failing the permission re-check
 * (PERMISSIONS_ARCHITECTURE §4.4.5). The money already moved; this is the
 * owner's notice, not a rollback.
 */
export interface ReplayFlag {
  author_id: string;
  /** @nullable */
  author_name?: string | null;
  /** @nullable */
  branch_id?: string | null;
  /** The `resource:action` cell the author did not hold. */
  capability: string;
  /** When it reached us. The gap is the offline window. */
  created_at: string;
  id: number;
  /** When the act happened on the device. */
  occurred_at: string;
  /** The replayed op, e.g. `CashMovement`. */
  op: string;
  /**
     * `stale_snapshot` — they held it when they acted and the device had not
     * heard the revocation yet. `unauthorized_offline` — nothing explains it.
     */
  reason: string;
  /** @nullable */
  reviewed_at?: string | null;
  /** @nullable */
  reviewed_by?: string | null;
}
