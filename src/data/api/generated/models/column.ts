/* eslint-disable */
// @ts-nocheck
import type { ColumnKind } from './columnKind';

/**
 * One output column: its SQL alias (also the JSON key) and how to render it.
 */
export interface Column {
  key: string;
  kind: ColumnKind;
  label: string;
}
