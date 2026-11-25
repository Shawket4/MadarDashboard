/* eslint-disable */
// @ts-nocheck
import type { PrintSheet } from './printSheet';

/**
 * A document to print, every value already in words.
 */
export interface PrintDoc {
  /** The file's name without its extension (`Madar-Recipes-2026-11-26`). */
  filename: string;
  /** Arabic: the pages run right to left. */
  rtl?: boolean;
  sheets: PrintSheet[];
}
