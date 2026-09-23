/* eslint-disable */
// @ts-nocheck
import type { CoverageNeed } from './coverageNeed';

export interface CoverageView {
  /** What POS sales suggest, one-hour bands, when POS is on. */
  derived: CoverageNeed[];
  /** The typed grid. */
  needs: CoverageNeed[];
  orders_per_staff: number;
  /**
     * What the engine uses: `grid` (typed), `pos` (derived from sales) or
     * `pattern` (the standing pattern's own coverage).
     */
  source: string;
}
