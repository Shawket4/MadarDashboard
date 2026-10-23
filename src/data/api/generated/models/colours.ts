/* eslint-disable */
// @ts-nocheck

/**
 * The pass's colours, `#RRGGBB`. Apple writes field values in `foreground`
 * and labels in `label` on `background`; Google takes `background` only.
 */
export interface Colours {
  background: string;
  foreground: string;
  label: string;
}
