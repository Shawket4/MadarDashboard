/* eslint-disable */
// @ts-nocheck
import type { ColumnKind } from './columnKind';

export interface FieldInfo {
  /**
     * One line on exactly what it counts. Absent for dimensions, whose label
     * is self-explanatory.
     * @nullable
     */
  help?: string | null;
  id: string;
  kind: ColumnKind;
  label: string;
  /** True for time axes. */
  time?: boolean;
}
