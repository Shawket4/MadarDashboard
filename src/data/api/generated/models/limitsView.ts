/* eslint-disable */
// @ts-nocheck

export interface LimitsView {
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
}
