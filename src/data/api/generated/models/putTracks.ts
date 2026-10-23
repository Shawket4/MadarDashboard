/* eslint-disable */
// @ts-nocheck
import type { Track } from './track';

export interface PutTracks {
  /**
     * The complete list, in position order, track 1 first. A track left out
     * is removed (its members' balances are kept, and come back with it).
     */
  tracks: Track[];
}
