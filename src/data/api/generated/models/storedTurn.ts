/* eslint-disable */
// @ts-nocheck

/**
 * One stored exchange.
 */
export interface StoredTurn {
  /** @nullable */
  answer?: string | null;
  created_at: string;
  id: string;
  /** `answer` | `clarify` | `incomplete`. */
  kind: string;
  /** @nullable */
  provider?: string | null;
  question: string;
  seq: number;
  /**
     * The queries that produced the answer — `[{title, preset_id, spec}]`.
     * Re-running these is how a reopened conversation shows CURRENT figures
     * rather than the numbers that were true when it was first asked.
     */
  specs: unknown;
}
