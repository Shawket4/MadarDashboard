/* eslint-disable */
// @ts-nocheck
import type { PrintAlign } from './printAlign';

/**
 * A column: its header, its width relative to the others (a spreadsheet
 * column's width), and how its values sit.
 */
export interface PrintColumn {
  align?: PrintAlign;
  header: string;
  width: number;
}
