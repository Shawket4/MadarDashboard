/* eslint-disable */
// @ts-nocheck

export interface FinalizeInput {
  /** The actual method the customer paid (overrides the hint). Must be an org method. */
  payment_method: string;
  /**
     * Who was picked as serving at checkout, on a branch that asks
     * (`branches.pick_teller_at_checkout`). Same rule as `sold_by` on an
     * order: attribution only; someone who cannot ring sales at the branch is
     * recorded as nobody, never refused. Additive.
     * @nullable
     */
  sold_by?: string | null;
  till_id: string;
}
