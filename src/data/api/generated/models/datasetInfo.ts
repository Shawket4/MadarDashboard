/* eslint-disable */
// @ts-nocheck
import type { FieldInfo } from './fieldInfo';
import type { FilterInfo } from './filterInfo';

export interface DatasetInfo {
  default_measures: string[];
  dimensions: FieldInfo[];
  filters: FilterInfo[];
  /** What one row is, and when to use this dataset instead of another. */
  help: string;
  id: string;
  measures: FieldInfo[];
  title: string;
}
