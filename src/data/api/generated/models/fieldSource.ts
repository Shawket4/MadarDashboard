/* eslint-disable */
// @ts-nocheck

/**
 * What an OS-drawn field shows.
 */
export type FieldSource = {
  /** @minimum 0 */
  track: number;
  type: 'balance';
} | {
  /** @minimum 0 */
  track: number;
  type: 'progress';
} | {
  /** @minimum 0 */
  track: number;
  type: 'rewards';
} | {
  type: 'member';
};
