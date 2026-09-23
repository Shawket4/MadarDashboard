/* eslint-disable */
// @ts-nocheck

/**
 * One band of the weekly coverage grid.
 */
export interface CoverageNeed {
  band_end: string;
  band_start: string;
  /** 0 = Sunday … 6 = Saturday. */
  day_of_week: number;
  /**
     * Only people of this department count toward it.
     * @nullable
     */
  department_id?: string | null;
  staff: number;
}
