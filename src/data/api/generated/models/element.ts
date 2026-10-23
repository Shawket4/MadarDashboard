/* eslint-disable */
// @ts-nocheck
import type { Cell } from './cell';
import type { ElementKind } from './elementKind';

/**
 * One thing on the strip, and where.
 */
export interface Element {
  cell: Cell;
  kind: ElementKind;
}
