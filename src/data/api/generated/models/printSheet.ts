/* eslint-disable */
// @ts-nocheck
import type { PrintBlock } from './printBlock';
import type { PrintStat } from './printStat';

/**
 * One sheet of the workbook, printed from a new page.
 */
export interface PrintSheet {
  blocks: PrintBlock[];
  /** Wide tables print across the page. */
  landscape?: boolean;
  stats?: PrintStat[];
  /** The line under the banner (filters, when it was made). */
  subtitle?: string;
  title: string;
}
