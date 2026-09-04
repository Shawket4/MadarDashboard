/* eslint-disable */
// @ts-nocheck
import type { BoardInfo } from './boardInfo';
import type { DatasetInfo } from './datasetInfo';
import type { PresetInfo } from './presetInfo';

/**
 * The complete registry, as served to a dashboard.
 */
export interface RegistryInfo {
  /** Built-in dashboard layouts a merchant can use or fork. */
  boards: BoardInfo[];
  datasets: DatasetInfo[];
  /** Named relative windows accepted in `period.preset`. */
  period_presets: string[];
  presets: PresetInfo[];
}
