/* eslint-disable */
// @ts-nocheck
import type { OnlineTaxPolicy } from './onlineTaxPolicy';

export interface PublicBranch {
  code: string;
  id: string;
  in_mall_enabled: boolean;
  /** Effective-open right now (enabled + open shift + override + window). */
  in_mall_open_now: boolean;
  /** When false, in-mall ordering does not require a device GPS location. */
  in_mall_require_location: boolean;
  name: string;
  /** When false, the public checkout skips OTP verification for this branch. */
  otp_required: boolean;
  outside_enabled: boolean;
  outside_open_now: boolean;
  pickup_enabled: boolean;
  pickup_open_now: boolean;
  /**
     * The tax this branch prices online orders under. The storefront renders
     * a tax line from it (exclusive) or an "includes VAT" note (inclusive) —
     * the same policy intake will freeze onto the order.
     */
  tax_policy: OnlineTaxPolicy;
  umbrella_enabled: boolean;
  umbrella_open_now: boolean;
}
