/* eslint-disable */
// @ts-nocheck

/**
 * C9: an owner-set surcharge for picking this size instead of the included
 * one. Without a row, a bigger size costs its usual price difference.
 */
export interface SizeSurcharge {
  size_label: string;
  surcharge: number;
}
