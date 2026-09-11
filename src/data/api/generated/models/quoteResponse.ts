/* eslint-disable */
// @ts-nocheck
import type { OnlineTaxPolicy } from './onlineTaxPolicy';

export interface QuoteResponse {
  /** @nullable */
  distance_meters?: number | null;
  /** @nullable */
  fee?: number | null;
  /** "ok" | "out_of_range" | "unavailable" */
  status: string;
  /**
     * The tax the cart will be priced under at this branch. A quote is a fee
     * quote — it has no cart, so no tax amount — but the page rendering the
     * checkout total needs the rate and the inclusivity beside the fee, or it
     * shows the customer one number and intake records another. Present on
     * every outcome: the policy is the branch's, not the address's.
     */
  tax_policy: OnlineTaxPolicy;
  /** @nullable */
  zone_id?: string | null;
  /** @nullable */
  zone_name?: string | null;
}
