/* eslint-disable */
// @ts-nocheck

export interface TopPer {
  /** Which of the chosen dimensions to rank within. */
  dimension: string;
  /**
     * How many rows to keep per group.
     * @minimum 0
     */
  n?: number;
}
