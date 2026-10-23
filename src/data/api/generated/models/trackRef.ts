/* eslint-disable */
// @ts-nocheck

/**
 * What rendering and validation need of a track: where it is and how big a
 * card it fills.
 */
export interface TrackRef {
  /** @minimum 0 */
  position: number;
  size: number;
}
