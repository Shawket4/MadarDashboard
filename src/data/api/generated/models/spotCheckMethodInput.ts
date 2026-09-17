/* eslint-disable */
// @ts-nocheck

export interface SpotCheckMethodInput {
  /** @nullable */
  counted?: number | null;
  /**
     * The expected figure the counter saw. Absent → the server's own figure.
     * @nullable
     */
  expected?: number | null;
  is_cash?: boolean;
  method: string;
}
