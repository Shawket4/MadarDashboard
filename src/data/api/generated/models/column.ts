/* eslint-disable */
// @ts-nocheck
import type { ColumnKind } from './columnKind';

/**
 * One output column: the SQL alias (also the JSON key on every row) plus how
 * to render it.
 */
export interface Column {
  /** SQL alias / JSON key. */
  key: string;
  kind: ColumnKind;
  /** Human label for a header or legend. */
  label: string;
}
