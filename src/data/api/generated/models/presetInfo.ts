/* eslint-disable */
// @ts-nocheck
import type { Grain } from './grain';
import type { PeriodPreset } from './periodPreset';
import type { Viz } from './viz';

export interface PresetInfo {
  category: string;
  dataset: string;
  default_period: PeriodPreset;
  description: string;
  /**
     * Result shape, so a widget picker knows a KPI card from a line chart
     * before running anything.
     */
  grain: Grain;
  id: string;
  /** Permission resource required, with the `read` action. */
  permission: string;
  title: string;
  viz: Viz;
}
