/* eslint-disable */
// @ts-nocheck

/**
 * A rectangle of whole cells: `col`/`row` from the leading top corner,
 * `w`×`h` cells.
 */
export interface Cell {
  /** @minimum 0 */
  col: number;
  /** @minimum 0 */
  h: number;
  /** @minimum 0 */
  row: number;
  /** @minimum 0 */
  w: number;
}
