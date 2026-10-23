/* eslint-disable */
// @ts-nocheck
import type { Track } from './track';

/**
 * The shop's tracks, for the dashboard (and anyone setting up a till).
 */
export interface TracksView {
  /** `points` or `visits` (the org default's). */
  mode: string;
  /** Track 1's size: the programme's card size. */
  track_one_size: number;
  /**
     * Every track in position order; track 1 always first. In a points
     * programme only track 1 (tracks 2–4 are kept but inactive).
     */
  tracks: Track[];
}
