/* eslint-disable */
// @ts-nocheck

/**
 * One payment method on a spot check: what the system expected and, when the
 * counter counted it, what they found. Cash is always the first line.
 */
export interface SpotCheckMethodLine {
  /**
     * Null when this method was not counted.
     * @nullable
     */
  counted?: number | null;
  /**
     * `counted - expected`, null when not counted.
     * @nullable
     */
  discrepancy?: number | null;
  expected: number;
  is_cash: boolean;
  method: string;
}
