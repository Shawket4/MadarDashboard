/* eslint-disable */
// @ts-nocheck

export interface LimitsView {
  /**
     * How old the thing acted on may be, in minutes.
     * @nullable
     */
  max_age_minutes?: number | null;
  /**
     * Money, minor units.
     * @nullable
     */
  max_amount?: number | null;
  /**
     * Basis points (1000 = 10%).
     * @nullable
     */
  max_percent?: number | null;
  /**
     * Stock value, minor units.
     * @nullable
     */
  max_value?: number | null;
  /**
     * Only the person's own work. Absent means unrestricted, so a dashboard
     * that predates the field keeps meaning what it always meant.
     * @nullable
     */
  own?: boolean | null;
}
