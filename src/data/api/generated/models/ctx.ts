/* eslint-disable */
// @ts-nocheck
import type { Mode } from './mode';
import type { TrackRef } from './trackRef';

/**
 * What the design is checked against: the shop's programme as it stands.
 */
export interface Ctx {
  /** The shop has a card photograph uploaded. */
  has_photo: boolean;
  mode: Mode;
  /** Every track with its card size (track 1's is the programme's). */
  tracks: TrackRef[];
}
