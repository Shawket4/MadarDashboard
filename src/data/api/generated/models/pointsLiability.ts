/* eslint-disable */
// @ts-nocheck

/**
 * What the programme owes its members.
 */
export interface PointsLiability {
  /** `"points"` or `"visits"` — the currency the valuation is in. */
  currency: string;
  /** Live members with a positive balance. */
  members_with_balance: number;
  outstanding_points: number;
  outstanding_visits: number;
  /**
     * Minor units one unit of the live currency has bought, on average, over
     * every redemption this org has recorded (value given ÷ balance spent).
     * `None` until the first redemption with a recorded value.
     * @nullable
     */
  value_per_unit_minor?: number | null;
  /**
     * The outstanding balance in the live currency × `value_per_unit_minor`,
     * rounded. An estimate — a balance is worth what it will be spent on.
     * @nullable
     */
  valued_minor?: number | null;
}
