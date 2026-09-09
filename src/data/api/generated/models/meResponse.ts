/* eslint-disable */
// @ts-nocheck
import type { TaxPolicyPublic } from './taxPolicyPublic';
import type { UserPublic } from './userPublic';

export interface MeResponse {
  /** Org currency code (e.g. "EGP"). */
  currency_code: string;
  /**
     * The full policy, including tax-inclusive pricing and service charge.
     *
     * A till re-reads this whenever it syncs, which is what makes a rate
     * changed in the dashboard reach a device that has not signed in for
     * weeks. Without it the till prices under a stale rate and — now that the
     * server refuses totals it disagrees with — cannot sell at all.
     */
  tax_policy: TaxPolicyPublic;
  /**
     * Org tax rate as a decimal (e.g. 0.14 = 14% VAT); 0.0 when the user has no
     * org. Exposed so the POS can compute a tax-inclusive cart total client-side.
     */
  tax_rate: number;
  user: UserPublic;
}
