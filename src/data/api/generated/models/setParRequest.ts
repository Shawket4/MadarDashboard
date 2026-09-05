/* eslint-disable */
// @ts-nocheck

/**
 * Par levels for one ingredient at one branch. `null` clears a level.
 */
export interface SetParRequest {
  /** @nullable */
  par_max?: number | null;
  /** @nullable */
  par_min?: number | null;
}
