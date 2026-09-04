/* eslint-disable */
// @ts-nocheck
import type { Column } from './column';
import type { Grain } from './grain';
import type { MetricResultRowsItem } from './metricResultRowsItem';
import type { PeriodInfo } from './periodInfo';
import type { Viz } from './viz';

export interface MetricResult {
  columns: Column[];
  /** @nullable */
  facet_by?: string | null;
  grain: Grain;
  period: PeriodInfo;
  /** @minimum 0 */
  row_count: number;
  rows: MetricResultRowsItem[];
  /** @nullable */
  title?: string | null;
  truncated: boolean;
  viz: Viz;
}
