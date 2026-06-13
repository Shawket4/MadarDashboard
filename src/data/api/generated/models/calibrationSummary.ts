/* eslint-disable */
// @ts-nocheck
import type { CalibrationPoint } from './calibrationPoint';

export interface CalibrationSummary {
  branch_id: string;
  /**
     * Fraction of accepted CM suggestions whose realized price landed
   * within ±2% of the suggested price. `None` below 10 samples.
     * @nullable
     */
  cm_in_range_pct?: number | null;
  points_cm: CalibrationPoint[];
  points_revenue: CalibrationPoint[];
  /** @nullable */
  revenue_in_range_pct?: number | null;
  /** @nullable */
  since?: string | null;
}
