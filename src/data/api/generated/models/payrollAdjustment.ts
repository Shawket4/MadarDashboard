/* eslint-disable */
// @ts-nocheck

export interface PayrollAdjustment {
  /** @nullable */
  amount_piastres?: number | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  effective_date: string;
  id: string;
  org_id: string;
  /**
     * What the RULE computed, before any human touched it. `None` on a
     * hand-entered row — nothing was overridden, so there is no "original".
     * @nullable
     */
  original_amount_piastres?: number | null;
  /** @nullable */
  overridden_at?: string | null;
  /** @nullable */
  override_reason?: string | null;
  /** @nullable */
  percent_of_base?: number | null;
  reason: string;
  source: string;
  status: string;
  updated_at: string;
  user_id: string;
  /** @nullable */
  user_name?: string | null;
  /** @nullable */
  waive_reason?: string | null;
  /**
     * A waived deduction keeps its amount and stays visible; payroll skips it.
     * @nullable
     */
  waived_at?: string | null;
}
