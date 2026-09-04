/* eslint-disable */
// @ts-nocheck

/**
 * The resolved window, echoed so a client can label an answer without
 * re-deriving "last month" itself.
 */
export interface PeriodInfo {
  /** @nullable */
  from?: string | null;
  /** @nullable */
  to?: string | null;
}
