/* eslint-disable */
// @ts-nocheck

/**
 * One weekly booking window. `dow`: 0 = Sunday … 6 = Saturday. `open`/`close`
 * are `HH:MM` local; a close at or before open means "closes after midnight".
 */
export interface HoursEntry {
  close: string;
  /** @minimum 0 */
  dow: number;
  open: string;
}
